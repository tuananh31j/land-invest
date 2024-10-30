import { Space, Tag } from 'antd';
import TableDisplay from '../../TableDisplay';
import { Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { EditOutlined } from '@ant-design/icons';
import useTable from '../../../hooks/useTable';

const TablePlans = () => {
    const { getColumnSearchProps } = useTable();
    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'search',
            render: (text) => <h4>{text}</h4>,
            ...getColumnSearchProps('name'),
            width: '20%',
        },
        {
            title: 'Thuộc tính',
            dataIndex: 'attributeNames',
            key: 'attributeNames',
            width: '70%',
            render: (_, record) => (
                <>
                    {record.attributeIds?.map((att) => {
                        return (
                            <Tag
                                color={att.isVariant ? 'geekblue' : att.isRequired ? 'red' : ''}
                                className="my-1"
                                key={att._id}
                            >
                                {att.name.toUpperCase()}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space size={'middle'}>
                    <Tooltip title="Cập nhật danh mục">
                        <Link to={``} className="text-blue-500">
                            <EditOutlined className="rounded-full bg-blue-100 p-2" style={{ fontSize: '1rem' }} />
                        </Link>
                    </Tooltip>
                </Space>
            ),
        },
    ];
    return (
        <>
            <h1>Kho dữ liệu</h1>
            <TableDisplay dataSource={[]} columns={columns} totalDocs={0} />
        </>
    );
};

export default TablePlans;
