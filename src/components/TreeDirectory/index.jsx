import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Tree, Spin } from 'antd';
import { fetchAllProvince, fetchDistrictsByProvinces } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import removeAccents from 'remove-accents';
import { LoadingOutlined } from '@ant-design/icons';
import Search from 'antd/es/input/Search';
import { getBoundingBoxCenterFromString } from '../../function/getCenterByBoundingbox';
import axios from 'axios';

const TreeDirectory = () => {
    const [treeData, setTreeData] = useState([]);
    const [originalTreeData, setOriginalTreeData] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    useEffect(() => {
        fetchProvinces();
        const quyhoachParams = searchParams.get('quyhoach');
        if (quyhoachParams) {
            const quyhoachKeys = quyhoachParams.split(',').map((id) => `plan-${id}`);
            setCheckedKeys(quyhoachKeys);
        }
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
            const { data } = await axios.get(`https://apilandinvest.gachmen.org/quyhoach1quan/${districtId}`);
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
            if (!Array.isArray(checkedKeysValue)) return;
            setCheckedKeys(checkedKeysValue);
            const quyhoachIds = checkedKeysValue
                .filter((key) => key?.startsWith('plan-'))
                .map((key) => key?.split('-')[1])
                .filter((id) => id != null);
            const districtIds = checkedKeysValue
                .filter((key) => key?.startsWith('district-'))
                .map((key) => key?.split('-')[1])
                .filter((id) => id != null);

            if (districtIds.length > 0 && quyhoachIds.length > 0) {
                const id = districtIds[districtIds.length - 1];

                const { data } = await axios.get(`https://apilandinvest.gachmen.org/quyhoach1quan/${id}`);
                const { centerLatitude, centerLongitude } = getBoundingBoxCenterFromString(data[0]?.boundingbox);

                searchParams.set('quyhoach', quyhoachIds.toString());
                searchParams.set('vitri', `${centerLatitude},${centerLongitude}`);
            } else {
                searchParams.delete('quyhoach');
            }

            navigate({
                search: searchParams.toString(),
            });
        },
        [navigate, searchParams],
    );

    const filterTreeData = (searchTerm) => {
        setLoadingSearch(true);
        const normalizedTerm = removeAccents(searchTerm.toLowerCase());
        const expandedKeysSet = new Set();

        const filterNodes = (nodes, parentMatched = false) => {
            return nodes.reduce((acc, node) => {
                const nodeMatch = removeAccents(node.title.toLowerCase()).includes(normalizedTerm);
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
    // console.log(treeData, 'treeData gggfdgdfg');

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
