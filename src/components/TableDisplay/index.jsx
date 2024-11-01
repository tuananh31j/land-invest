import React from 'react';
import { Pagination, Space, Table } from 'antd';

const TableDisplay = ({
    dataSource,
    columns,
    totalDocs,
    onFilter = () => {},
    onSelectPaginateChange = () => {},
    currentPage = 1,
}) => {
    const onChange = (_, filters, sorter) => {
        onFilter(filters, sorter);
    };

    return (
        <div className="h-[100vh] w-[100vw]">
            <Table
                rowKey="id"
                bordered={true}
                loading={!dataSource}
                onChange={onChange}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
            />
            <Space className="m-5 flex w-full justify-end">
                <Pagination onChange={onSelectPaginateChange} pageSize={10} total={totalDocs} current={currentPage} />
            </Space>
        </div>
    );
};
export default TableDisplay;
