import React, { useState, useEffect, memo, useCallback } from 'react';
import { Tree, Spin } from 'antd';
import {
    all_plans_by_province,
    fetchAllProvince,
    fetchAllQuyHoach,
    fetchDistrictsByProvinces,
} from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import removeAccents from 'remove-accents';
import { LoadingOutlined } from '@ant-design/icons';
import Search from 'antd/es/input/Search';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentLocation } from '../../redux/search/searchSlice';
import fetchProvinceName from '../../function/findProvince';
import getCenterOfBoundingBoxes from '../../function/getCenterOfBoundingBoxes';
import { setPlansInfo } from '../../redux/plansSelected/plansSelected';
import useTable from '../../hooks/useTable';

const TreeDirectory = () => {
    const quyHoachIdsStored = useSelector((state) => state.plansSelected.quyhoach);
    const [treeData, setTreeData] = useState([]);
    const [originalTreeData, setOriginalTreeData] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState(
        quyHoachIdsStored.map((item) => `plan-${item.id}-${item.ProvinceID}`),
    );
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { query } = useTable();
    const [allPlansByProvince, setAllPlansByProvince] = useState([]);

    useEffect(() => {
        (async () => {
            await fetchProvinces();
            const quyhoachParams = searchParams.get('quyhoach');
            if (quyhoachParams) {
                const quyhoachKeys = quyhoachParams.split(',').map((item) => {
                    const [id, provinceId] = item.split('-');
                    return `plan-${id}-${provinceId}`;
                });
                setCheckedKeys(quyhoachKeys);
            } else {
                setCheckedKeys([]);
                setPlansInfo([]);
            }
        })();
    }, []);

    // update tree data to local storage
    useEffect(() => {
        (async () => {
            const data = await all_plans_by_province(true);
            setAllPlansByProvince(data);
        })();
    }, []);
    // update tree data to local storage
    useEffect(() => {
        (async () => {
            await fetchProvinces(true, true);
        })();
    }, []);

    useEffect(() => {
        if (debouncedSearchTerm) {
            filterTreeData(debouncedSearchTerm);
        } else {
            setTreeData(originalTreeData);
            setExpandedKeys([]);
            setAutoExpandParent(false);
        }
    }, [debouncedSearchTerm, originalTreeData]);

    const fetchProvinces = async (isReload = false, noLoadingUI = false) => {
        try {
            const treeDataStored = localStorage.getItem('treeData');

            if (treeDataStored && !isReload) {
                const filteredProvincesData = JSON.parse(treeDataStored);
                setTreeData(filteredProvincesData);
                setOriginalTreeData(filteredProvincesData);
            } else {
                setLoading(!noLoadingUI);
                const provinces = await fetchAllProvince();
                const provincesData = await Promise.all(
                    provinces.map(async (province) => {
                        const districts = await fetchDistricts(province.TinhThanhPhoID);
                        if (districts.length > 0) {
                            return {
                                title: province.TenTinhThanhPho.toLowerCase()
                                    .split(' ')
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' '),
                                key: `province-${province.TinhThanhPhoID}`,
                                children: districts,
                                isLeaf: false,
                            };
                        }
                        return null;
                    }),
                );
                const filteredProvincesData = provincesData.filter((province) => province !== null);
                setTreeData(filteredProvincesData);
                setOriginalTreeData(filteredProvincesData);
                localStorage.setItem('treeData', JSON.stringify(filteredProvincesData));
            }
        } catch (error) {
            console.error('Error fetching provinces:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDistricts = async (provinceId) => {
        try {
            const districts = await fetchDistrictsByProvinces(provinceId);
            const districtDataWithPlanning = await Promise.all(
                districts.map(async (district) => {
                    const planningData = await fetchPlanningData(district.DistrictID);
                    if (planningData.length > 0) {
                        return {
                            title: district.DistrictName,
                            key: `district-${district.DistrictID}`,
                            children: planningData,
                            isLeaf: false,
                        };
                    }
                    return null;
                }),
            );
            return districtDataWithPlanning.filter((district) => district !== null);
        } catch (error) {
            console.error('Error fetching districts:', error);
            return [];
        }
    };

    const fetchPlanningData = async (districtId) => {
        try {
            const { data } = await axios.get(`https://api.quyhoach.xyz/quyhoach1quan/${districtId}`);
            if (Array.isArray(data) && data.length > 0) {
                return data.map((plan) => ({
                    title: plan.description,
                    key: `plan-${plan.id}-${plan.ProvinceID}`,
                    isLeaf: true,
                }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching planning data:', error);
            return [];
        }
    };

    const onCheck = useCallback(
        async (checkedKeysValue) => {
            try {
                if (!Array.isArray(checkedKeysValue)) return;
                setCheckedKeys(checkedKeysValue);
                const provinceIds = checkedKeysValue
                    .filter((key) => key?.startsWith('province-'))
                    .map((key) => key?.split('-')[1]);

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
                    const allPlans = await fetchAllQuyHoach();
                    const map = {};
                    const memory = [];
                    allPlans
                        .filter((item) => quyhoachIds.includes(item.id.toString()))
                        .forEach((element) => {
                            const key = `${element.idDistrict}-${element.idProvince}`;
                            map[key] = (map[key] || 0) + 1;
                        });
                    const plansFiltered = allPlans
                        .filter((item) => quyhoachIds.includes(item.id.toString()))
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
                            return item.boundingbox.replace(/[\[\]]/g, '').split(',');
                        })
                        .filter((item) => item != null && Array.isArray(item) && item.length === 4);
                    const center = getCenterOfBoundingBoxes(boudingBoxes);
                    const info = await fetchProvinceName(center[1], center[0]);
                    console.log(info, 'info');

                    dispatch(
                        setCurrentLocation({
                            lat: center[1],
                            lon: center[0],
                            provinceName: info.provinceName,
                            districtName: info.districtName,
                        }),
                    );
                    dispatch(setPlansInfo(plansFiltered));
                    setCheckedKeys(plansFiltered.map((item) => `plan-${item.id}-${item.ProvinceID}`));
                    console.log(plansFiltered, 'plansFiltered');

                    searchParams.delete('quyhoach');
                    searchParams.set('quyhoach', plansParams.toString());
                    setSearchParams(searchParams);
                } else {
                    searchParams.delete('quyhoach');
                    setSearchParams(searchParams);
                    dispatch(setPlansInfo([]));
                }
            } catch (error) {
                console.log(error, '111111111');
            }
        },
        [dispatch, searchParams, setSearchParams],
    );

    const filterTreeData = (searchTerm) => {
        setLoadingSearch(true);
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

        const filteredData = filterNodes(originalTreeData);
        setTreeData(filteredData);
        setExpandedKeys(Array.from(expandedKeysSet));
        setAutoExpandParent(true);
        setLoadingSearch(false);
    };

    const onExpand = (expandedKeysValue) => {
        setExpandedKeys(expandedKeysValue);
        setAutoExpandParent(false);
    };

    return (
        <>
            <Search
                loading={loadingSearch}
                placeholder="Search provinces or districts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: 8 }}
            />
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                </div>
            )}
            {treeData.length > 0 ? (
                <Tree
                    showLine
                    treeData={treeData}
                    checkable
                    checkedKeys={checkedKeys}
                    onCheck={onCheck}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onExpand={onExpand}
                />
            ) : (
                <p className="text-center">Dữ liệu đang cập nhật!</p>
            )}
        </>
    );
};

export default memo(TreeDirectory);
