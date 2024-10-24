import { Button, Table } from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FaMap } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';

const columns = (handleMapClick) => [
    {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Lệnh',
        key: 'action',
        render: (_, record) => (
            <Button
                type="primary"
                icon={<FaMap />}
                onClick={() => handleMapClick(record.id)}
            >
                See plan map
            </Button>
        ),
    },
];

const PlanMap = () => {
    const [data, setData] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await axios.get('https://apilandinvest.gachmen.org/all_quyhoach');
            setData(data);
        };

        fetchData();
    }, []);

    const handleMapClick = (id) => {
        const searchParams = new URLSearchParams(location.search);
        const allSelectedIds = [...new Set([...selectedRowKeys, id])]; // Combine selected IDs and the current one
        searchParams.set('quyhoach', allSelectedIds.join(','));
        navigate(`/?${searchParams.toString()}`);
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    return (
        <Table
            rowSelection={rowSelection}
            dataSource={data}
            columns={columns(handleMapClick)}
            rowKey="id"
        />
    );
};

export default PlanMap;
