import TableDisplay from '../../TableDisplay';
import useTable from '../../../hooks/useTable';
import { useEffect, useState } from 'react';
import { fetchAllProvince, fetchAllQuyHoach, fetchDistrictsByProvinces } from '../../../services/api';
import axios from 'axios';

const TablePlans = () => {
    const { getColumnSearchProps } = useTable();
    const [dataSource, setDataSource] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const plans = await fetchAllQuyHoach();
                const provinces = await fetchAllProvince();
                const districtsPromises = provinces.map((province) => fetchDistrictsByProvinces(province.id));
                const districts = await Promise.all(districtsPromises);
                console.log(provinces, 'provinces');
                console.log(districts, 'districts');
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        })();
    }, []);
    const columns = [
        {
            title: 'STT',
            dataIndex: 'name',
        },
        {
            title: 'Tên quy hoạch',
            dataIndex: 'plan',
            key: 'search',
            render: (text) => <h4>{text}</h4>,
            ...getColumnSearchProps('plan'),
            width: '20%',
        },
        {
            title: 'Tỉnh/Thành phố',
            dataIndex: 'province',
            key: 'search',
        },
        {
            title: 'Quân/Huyện',
            dataIndex: 'district',
            key: 'search',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'date',
        },
    ];
    return <TableDisplay dataSource={dataSource} columns={columns} totalDocs={0} />;
};

export default TablePlans;
