import { Card, Col, Row, Statistic } from "antd";
import { useEffect, useState } from "react";
// import { callFetchDashboard } from "../../../services/api";
const AdminPage = () =>  {
    // const [dataDashboard, setDataDashboard] = useState({
    //     countUser:0,
    //     countOrder:0
    // });

    // useEffect(()=> {
    //     const initDashboard = async () => {
    //         const res = await callFetchDashboard();
    //         if(res && res.data) setDataDashboard(res.data)
    //     }
    //     initDashboard();
    // },[])

    return (  
        <Row gutter={[40, 40]} style={{margin:'10px'}}>
            <Col span={10}>
                <Card
                    title="" bordered={false}
                >   
                    <Statistic
                        title='Tổng users'
                        // value={dataDashboard.countUser}
                    >
                    </Statistic>
                </Card>
            </Col>
            <Col span={10}>
                <Card
                    title="" bordered={false}
                >   
                    <Statistic
                        title='Tổng đơn hàng'
                        // value={dataDashboard.countOrder}
                    >
                    </Statistic>
                </Card>
            </Col>

        </Row>
    );
}

export default AdminPage;