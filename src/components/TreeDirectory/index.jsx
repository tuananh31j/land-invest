import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Tree, Spin } from 'antd';
import { fetchAllProvince, fetchAllQuyHoach, fetchDistrictsByProvinces } from '../../services/api';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
    const [checkedKeys, setCheckedKeys] = useState(quyHoachIdsStored.map((item) => `plan-${item.id}`));
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { query } = useTable();

    useEffect(() => {
        fetchProvinces();
        const quyhoachParams = searchParams.get('quyhoach');
        if (quyhoachParams) {
            const quyhoachKeys = quyhoachParams.split(',').map((id) => `plan-${id}`);
            setCheckedKeys(quyhoachKeys);
        } else {
            setCheckedKeys([]);
            setPlansInfo([]);
        }
    }, [query, quyHoachIdsStored]);

    useEffect(() => {
        if (debouncedSearchTerm) {
            filterTreeData(debouncedSearchTerm);
        } else {
            setTreeData(originalTreeData);
            setExpandedKeys([]);
            setAutoExpandParent(false);
        }
    }, [debouncedSearchTerm, originalTreeData]);

    const fetchProvinces = async () => {
        try {
            setLoading(true);
            const provinces = await fetchAllProvince();
            const provincesData = await Promise.all(
                provinces.map(async (province) => {
                    const districts = await fetchDistricts(province.TinhThanhPhoID);
                    if (districts.length > 0) {
                        return {
                            title: province.TenTinhThanhPho,
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
                    key: `plan-${plan.id}`,
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
                console.log(checkedKeysValue, 'checkedKeysValue');
                const quyhoachIds = checkedKeysValue
                    .filter((key) => key?.startsWith('plan-'))
                    .map((key) => key?.split('-')[1])
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
                    // allPlans.filter((item) => {
                    //     const key = `${item.idDistrict}-${item.idProvince}`;
                    //     const hasManyPlan = map[key] > 1;
                    //     const is2030 = item.description.toLowerCase().includes('2030');
                    //     const isNotInMemory = !memory.includes(key);
                    //     console.log(isNotInMemory, 'isNotInMemory');
                    //     if (hasManyPlan && is2030) {
                    //         return true;
                    //     } else if (isNotInMemory) {
                    //         memory.push(key);
                    //         return true;
                    //     }
                    //     return false;
                    // });

                    const plansFiltered = allPlans
                        .filter((item) => quyhoachIds.includes(item.id.toString()))
                        .filter((item) => {
                            const key = `${item.idDistrict}-${item.idProvince}`;
                            const hasManyPlan = map[key] > 1;
                            console.log(item.description);
                            const is2030 = item.description.toLowerCase().includes('2030');
                            const isNotInMemory = !memory.includes(key);
                            if (hasManyPlan && is2030) {
                                console.log('object');
                                return true;
                            } else if (isNotInMemory) {
                                memory.push(key);
                                console.log('3333');
                                return true;
                            }
                            return false;
                        })
                        .map((item) => item);

                    const boudingBoxes = plansFiltered
                        .map((item) => {
                            return item.boundingbox.replace(/[\[\]]/g, '').split(',');
                        })
                        .filter((item) => item != null);
                    console.log(plansFiltered, 'plansFiltered');
                    console.log(allPlans, 'allPlans');
                    console.log(boudingBoxes, 'boudingBoxes');
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

                    searchParams.delete('quyhoach');
                    searchParams.set('quyhoach', quyhoachIds.toString());
                    setSearchParams(searchParams);
                } else {
                    searchParams.delete('quyhoach');
                    setSearchParams(searchParams);
                    dispatch(setPlansInfo([]));
                }
            } catch (error) {
                console.log(error, '4444444');
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
