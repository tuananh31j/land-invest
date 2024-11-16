import React, { useState, useEffect, memo, useCallback } from 'react';
import { Tree, Spin } from 'antd';
import { fetchAllQuyHoach } from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import removeAccents from 'remove-accents';
import { LoadingOutlined } from '@ant-design/icons';
import Search from 'antd/es/input/Search';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentLocation } from '../../redux/search/searchSlice';
import fetchProvinceName from '../../function/findProvince';
import getCenterOfBoundingBoxes from '../../function/getCenterOfBoundingBoxes';
import { setPlansInfo } from '../../redux/plansSelected/plansSelected';
import { getTreePlans, searchTreePlans, setExpandedKeys } from '../../redux/apiCache/treePlans';
import { THUNK_API_STATUS } from '../../constants/thunkApiStatus';

const TreeDirectory = ({ doRefreshTreeData, isRefreshTreeData }) => {
    const treePlans = useSelector((state) => state.treePlans);
    const quyHoachIdsStored = useSelector((state) => state.plansSelected.quyhoach);
    const [searchTerm, setSearchTerm] = useState();
    const dispatch = useDispatch();
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTreeData = useSelector((state) => state.treePlans.searchTreeData);
    const onCheck = useCallback(
        async (checkedKeysValue) => {
            try {
                const allPlans = await fetchAllQuyHoach();

                if (!Array.isArray(checkedKeysValue)) return;
                const plansParams = [];
                const quyhoachIds = checkedKeysValue
                    .filter((key) => key?.startsWith('plan-'))
                    .map((key) => {
                        const item = key?.split('-');
                        plansParams.push([item[1], item[2]].join('-'));
                        return item[1];
                    })
                    .filter((id) => id != null);
                const districtIds = checkedKeysValue
                    .filter((key) => key?.startsWith('district-'))
                    .map((key) => key?.split('-')[1])
                    .filter((id) => id != null);

                if (districtIds.length > 0 && quyhoachIds.length > 0) {
                    const map = {};
                    const memory = [];
                    allPlans
                        .filter((item) => quyhoachIds?.toString().includes(item.id?.toString()))
                        .forEach((element) => {
                            const key = `${element.idDistrict}-${element.idProvince}`;
                            map[key] = (map[key] || 0) + 1;
                        });
                    const plansFiltered = allPlans
                        .filter((item) => quyhoachIds.includes(item.id?.toString()))
                        .filter((item) => {
                            const key = `${item.idDistrict}-${item.idProvince}`;
                            const hasManyPlan = map[key] > 1;
                            const is2030 = item.description.toLowerCase().includes('2030');
                            const isNotInMemory = !memory.includes(key);
                            if (hasManyPlan && is2030) {
                                return true;
                            } else if (isNotInMemory) {
                                memory.push(key);
                                return true;
                            }
                            return false;
                        })
                        .map((item) => item);

                    const boudingBoxes = plansFiltered
                        .map((item) => {
                            return item.boundingbox?.replace(/[\[\]]/g, '').split(',');
                        })
                        .filter((item) => item != null && Array.isArray(item) && item.length === 4);
                    const center = getCenterOfBoundingBoxes(boudingBoxes);
                    const info = await fetchProvinceName(center[1], center[0]);

                    dispatch(
                        setCurrentLocation({
                            lat: center[1],
                            lon: center[0],
                            provinceName: info.provinceName,
                            districtName: info.districtName,
                        }),
                    );
                    dispatch(setPlansInfo(plansFiltered));
                    searchParams.delete('quyhoach');
                    searchParams.set('quyhoach', plansParams.join(','));
                    setSearchParams(searchParams);
                } else {
                    searchParams.delete('quyhoach');
                    setSearchParams(searchParams);
                    dispatch(setPlansInfo([]));
                }
            } catch (error) {
                console.log(error);
            }
        },
        [dispatch, searchParams, setSearchParams],
    );

    const handleSearchTree = useCallback((debouncedSearchTerm) => {
        if (!debouncedSearchTerm) {
            return dispatch(searchTreePlans({ newTree: [], expandedKeys: [], autoExpandParent: false }));
        }
        const data = filterTreeData(debouncedSearchTerm);
        dispatch(searchTreePlans(data));
        setLoadingSearch(false);
    }, []);

    const filterTreeData = (searchTerm) => {
        const normalizedTerm = removeAccents(searchTerm?.toLowerCase());
        const expandedKeysSet = new Set();

        const filterNodes = (nodes, parentMatched = false) => {
            return nodes.reduce((acc, node) => {
                const nodeMatch = removeAccents(node.title?.toLowerCase())?.includes(normalizedTerm);
                const filteredChildren = node.children ? filterNodes(node.children, nodeMatch || parentMatched) : [];

                if (nodeMatch || filteredChildren.length > 0 || parentMatched) {
                    if (nodeMatch || parentMatched) {
                        expandedKeysSet.add(node.key);
                    }
                    return [
                        ...acc,
                        {
                            ...node,
                            children: filteredChildren,
                        },
                    ];
                }
                return acc;
            }, []);
        };

        const filteredData = filterNodes(treePlans.treeOriginal);

        return { newTree: filteredData, expandedKeys: Array.from(expandedKeysSet), autoExpandParent: true };
    };
    useEffect(() => {
        dispatch(getTreePlans());
    }, []);
    useEffect(() => {
        handleSearchTree(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    const onExpand = (expandedKeysValue) => {
        dispatch(setExpandedKeys(expandedKeysValue));
    };
    return (
        <>
            <Search
                loading={loadingSearch}
                placeholder="Search provinces or districts"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setLoadingSearch(true);
                }}
                style={{ marginBottom: 8 }}
            />
            {treePlans.status === THUNK_API_STATUS.PENDING && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                </div>
            )}
            {treePlans.treeOriginal.length > 0 && treePlans.status === THUNK_API_STATUS.SUCCESS ? (
                <Tree
                    showLine
                    treeData={searchTreeData.length > 0 ? searchTreeData : treePlans.treeOriginal}
                    checkable
                    checkedKeys={quyHoachIdsStored.map((item) => `plan-${item.id}-${item.idProvince}`)}
                    onCheck={onCheck}
                    expandedKeys={treePlans.expandedKeys}
                    autoExpandParent={treePlans.autoExpandParent}
                    onExpand={onExpand}
                />
            ) : (
                <p className="text-center">Dữ liệu đang cập nhật!</p>
            )}
        </>
    );
};

export default memo(TreeDirectory);
