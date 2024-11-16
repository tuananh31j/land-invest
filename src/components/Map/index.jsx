import React, { memo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon, LayersControl, Pane } from 'react-leaflet';
import L from 'leaflet';
import DrawerView from '../Home/DrawerView';
import fetchProvinceName from '../../function/findProvince';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ResetCenterView from '../../function/resetCenterView';
import { selectFilteredMarkers } from '../../redux/filter/filterSelector';
import { formatToVND } from '../../function/formatToVND';
import { setListMarker } from '../../redux/listMarker/listMarkerSllice';
import useMapParams from '../../hooks/useMapParams';
import { FaShareAlt } from 'react-icons/fa';
import { message, notification, Radio } from 'antd';
import {
    fetchAllQuyHoach,
    fetchListInfo,
    fetQuyHoachByIdDistrict,
    getALLPlansByProvince,
    searchLocation,
} from '../../services/api';
import useGetParams from '../Hooks/useGetParams';
import { setCurrentLocation } from '../../redux/search/searchSlice';
import UserLocationMarker from '../UserLocationMarker';
import { debounce } from 'lodash';
import { polygonsData } from '../../data/polygons';
import getCenterOfBoundingBoxes from '../../function/getCenterOfBoundingBoxes';
import { setPlanByProvince, setPlansInfo } from '../../redux/plansSelected/plansSelected';
import useWindowSize from '../../hooks/useWindowSise';

const customIcon = new L.Icon({
    iconUrl: require('../../assets/marker.png'),
    iconSize: [38, 38],
    iconAnchor: [22, 38],
    popupAnchor: [-3, -38],
});

const Map = ({ opacity, mapRef, setSelectedPosition, setIdDistrict, idDistrict }) => {
    const [isOverview, setIsOverview] = useState(false);
    const [listenDblClick, setListenDblClick] = useState(false);
    const [idProvince, setIdProvince] = useState();
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const searchParams = useGetParams();
    const locationLink = useLocation();
    const dispatch = useDispatch();
    const listMarker = useSelector(selectFilteredMarkers);
    const currentLocation = useSelector((state) => state.searchQuery.searchResult);
    const [messageApi, contextHolder] = message.useMessage();
    const [api, contextHolderNoti] = notification.useNotification();
    const plansStored = useSelector((state) => state.plansSelected.quyhoach);
    const quyhoachByProvince = useSelector((state) => state.plansSelected.quyhoachByProvince);
    const { initialCenter, initialZoom } = useMapParams();
    const windowSize = useWindowSize();
    const [searchPara, setSearchPara] = useSearchParams();
    const closeDrawer = () => setIsDrawerVisible(false);

    const MapEvents = () => {
        const map = useMapEvents({
            moveend: async (e) => {
                const map = e.target;
                const center = map.getCenter();
                const zoom = map.getZoom();
                const info = await fetchProvinceName(center.lat, center.lng);

                const searchParams = new URLSearchParams(locationLink.search);
                searchParams.set('vitri', `${center.lat},${center.lng}`);
                searchParams.set('zoom', `${zoom}`);

                const newUrl = `${locationLink.pathname}?${searchParams.toString()}`;
                window.history.replaceState({}, '', newUrl);

                if (zoom >= 8) {
                    try {
                        const res = await searchLocation(info?.districtName);
                        res ? setIdProvince(res.idDistrict) : setIdDistrict(null);
                    } catch (error) {
                        setIdDistrict(null);
                    }
                }
            },
            dblclick: debounce(
                async (e) => {
                    const { lat, lng } = e?.latlng;
                    map.setView([lat, lng]);
                    setSelectedPosition({ lat, lng });

                    try {
                        // Call API province
                        const info = await fetchProvinceName(lat, lng);
                        // Update position info
                        dispatch(
                            setCurrentLocation({
                                lat,
                                lon: lng,
                                provinceName: info.provinceName,
                                districtName: info.districtName,
                            }),
                        );
                        // Call API district
                        const res = await searchLocation(info?.districtName);
                        res ? setIdDistrict(res.idDistrict) : setIdDistrict(null);
                        setListenDblClick(Math.random());
                    } catch (error) {
                        setIdDistrict(null);
                    }
                },
                500,
                { leading: false, trailing: true },
            ),
            zoomend: async () => {
                const zoom = map.getZoom();
                if (zoom < 10) {
                    setIsOverview(true);
                } else {
                    setIsOverview(false);
                }
            },
        });
        map.doubleClickZoom.disable();

        return null;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetQuyHoachByIdDistrict(idDistrict);
                const plans = await fetchAllQuyHoach();
                if (data && data.length > 0 && data[0]?.huyen_image !== '') {
                    if (data.length > 1) {
                        openNotification(true)(data, plans);
                        dispatch(setPlansInfo(plans.filter((item) => item.id === data[0].id)));
                        searchPara.set('quyhoach', `${data[0].id}-${data[0].idProvince}`);
                        setSearchPara(searchPara);
                    } else {
                        dispatch(setPlansInfo(plans.filter((item) => item.id === data[0].id)));
                        searchPara.set('quyhoach', `${data[0].id}-${data[0].idProvince}`);
                        setSearchPara(searchPara);
                    }
                } else {
                    if (idDistrict && listenDblClick) {
                        messageApi.info('Không tìm thấy quy hoạch cho khu vực này');
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [listenDblClick]);

    useEffect(() => {
        (async () => {
            try {
                const vitri = searchParams.get('vitri') ? searchParams.get('vitri').split(',') : null;
                const quyhoachIds = searchParams.get('quyhoach');
                const allPlansByProvince = await getALLPlansByProvince();
                const plansByProvince = searchParams.get('plans-by-province')
                    ? searchParams.get('plans-by-province').split(',')
                    : null;
                if (!!plansByProvince) {
                    const plansByProvinceFiltered = allPlansByProvince.filter((item) =>
                        plansByProvince.includes(item.idProvince.toString()),
                    );
                    dispatch(setPlanByProvince(plansByProvinceFiltered));
                } else {
                    dispatch(setPlanByProvince([]));
                }
                if (!!quyhoachIds) {
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
                        .filter((item) => item != null);

                    const center = getCenterOfBoundingBoxes(boudingBoxes);
                    dispatch(setPlansInfo(plansFiltered));
                    const info = await fetchProvinceName(center[1], center[0]);
                    dispatch(
                        setCurrentLocation({
                            lat: center[1],
                            lon: center[0],
                            provinceName: info.provinceName,
                            districtName: info.districtName,
                        }),
                    );
                } else if (vitri && vitri.length > 0) {
                    const lat = parseFloat(vitri[0]);
                    const lng = parseFloat(vitri[1]);
                    dispatch(setPlansInfo([]));
                    const info = await fetchProvinceName(lat, lng);
                    dispatch(
                        setCurrentLocation({
                            lat,
                            lon: lng,
                            provinceName: info.provinceName,
                            districtName: info.districtName,
                        }),
                    );
                    const res = await searchLocation(info?.districtName);
                    res ? setIdDistrict(res.idDistrict) : setIdDistrict(null);
                    setListenDblClick(Math.random());
                }
            } catch (error) {
                console.log('error', error);
                setIdDistrict(null);
            }
        })();
    }, []);

    useEffect(() => {
        if (!idProvince) return;

        const fetchData = async () => {
            try {
                const data = await fetchListInfo(idProvince);
                dispatch(setListMarker(data.data || []));
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [idProvince]);

    // useEffect(() => {
    //     (async () => {
    //         const data = await getALLPlansByProvince();
    //         setAllPlansByProvince(data);
    //     })();
    // }, []);
    const handleShareClick = (lat, lng) => {
        const urlParams = new URLSearchParams(locationLink.search);

        urlParams.set('vitri', `${lat},${lng}`);

        const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;

        navigator.clipboard
            .writeText(newUrl)
            .then(() => {
                messageApi.open({
                    type: 'success',
                    content: 'Đã sao chép vào bộ nhớ',
                });
            })
            .catch((err) => {
                messageApi.open({
                    type: 'error',
                    content: 'Lỗi khi sao chép vào bộ nhớ',
                });
            });
    };
    const openNotification = (pauseOnHover) => (data, plans) => {
        api.open({
            message: 'Khu vực này có nhiều quy hoạch, vui lòng chọn quy hoạch để xem!',
            description: (
                <Radio.Group
                    onChange={(e) => {
                        const target = plans.map((item) => item).filter((item) => item.id == e.target.value);
                        dispatch(setPlansInfo(target));
                        console.log(target, 'target');
                        searchPara.set('quyhoach', `${e.target.value}-${target[0].idProvince}`);
                        setSearchPara(searchPara);
                        api.destroy();
                    }}
                    value={data[0].id}
                >
                    {data.map((plan) => (
                        <Radio key={plan.id} value={plan.id}>
                            {plan.description}
                        </Radio>
                    ))}
                </Radio.Group>
            ),
            showProgress: true,
            pauseOnHover,
        });
    };
    return (
        <>
            {contextHolder}
            {contextHolderNoti}

            {/* <Modal
                title="Khu vực này có nhiều quy hoạch, vui lòng chọn quy hoạch để xem!"
                open={planOption.length > 1}
                onOk={() => setPlanOption([])}
                onCancel={() => setPlanOption([])}
                centered
            >
                <Radio.Group onChange={(e) => setSelectedIDQuyHoach(e.target.value)} value={selectedIDQuyHoach}>
                    {planOption.map((plan) => (
                        <Radio key={plan.id} value={plan.id}>
                            {plan.description}
                        </Radio>
                    ))}
                </Radio.Group>
            </Modal> */}
            <MapContainer
                style={{
                    width: '100vw',
                    height: windowSize.windowWidth > 768 ? 'calc(100vh - 60px)' : 'calc(100vh - 30%)',
                }}
                center={initialCenter}
                zoom={initialZoom}
                maxZoom={30}
                ref={mapRef}
            >
                <UserLocationMarker />
                <MapEvents />
                {currentLocation && <ResetCenterView lat={currentLocation.lat} lon={currentLocation.lon} />}
                <LayersControl>
                    {windowSize.windowWidth < 768 && (
                        <LayersControl.BaseLayer checked name="Map vệ tinh">
                            <TileLayer
                                url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHVhbmFuaDMxaiIsImEiOiJjbTMzMmo2d3AxZ2g0Mmlwejl1YzM0czRoIn0.vCpAJx2b_FVhC3LDfmdLTA`}
                                attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors'
                                maxZoom={22}
                            />
                        </LayersControl.BaseLayer>
                    )}
                    {windowSize.windowWidth > 768 && (
                        <LayersControl.BaseLayer checked name="Map vệ tinh">
                            <TileLayer
                                url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                maxZoom={30}
                                attribution="&copy; <a href='https://www.google.com/maps'>Google Maps</a> contributors"
                            />
                        </LayersControl.BaseLayer>
                    )}

                    <LayersControl.BaseLayer name="Map mặc định">
                        <TileLayer
                            maxZoom={22}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                <Pane name="PaneThai" style={{ zIndex: 650 }}>
                    {plansStored &&
                        plansStored.length > 0 &&
                        plansStored.map((item, index) => (
                            <TileLayer
                                key={index}
                                url={`${item.huyen_image}/{z}/{x}/{y}`}
                                pane="overlayPane"
                                minZoom={1}
                                maxZoom={22}
                                opacity={opacity}
                            />
                        ))}
                    {quyhoachByProvince &&
                        quyhoachByProvince.length > 0 &&
                        quyhoachByProvince.map((item, index) => (
                            <TileLayer
                                key={index}
                                url={`${item.huyen_image}/{z}/{x}/{y}`}
                                pane="overlayPane"
                                minZoom={1}
                                maxZoom={22}
                                opacity={opacity}
                            />
                        ))}

                    {/* <TileLayer
                        url={`https://apilandinvest.gachmen.org/get_api_quyhoach/452/{z}/{x}/{y}`}
                        pane="overlayPane"
                        minZoom={1}
                        maxZoom={22}
                        opacity={opacity}
                    /> */}
                    {/* {selectedIDQuyHoach && (
                        <TileLayer
                            url={`https://api.quyhoach.xyz/get_api_quyhoach/${selectedIDQuyHoach}/{z}/{x}/{y}`}
                            pane="overlayPane"
                            minZoom={12}
                            maxZoom={22}
                            opacity={opacity}
                        />
                    )} */}
                </Pane>
                {currentLocation && currentLocation.lat && currentLocation.lon && (
                    <Marker position={[currentLocation.lat, currentLocation.lon]} icon={customIcon}>
                        <Popup>
                            <div>
                                <h3 style={{ fontWeight: 600 }}>
                                    Tỉnh {currentLocation?.provinceName}, Huyện {currentLocation?.districtName}
                                </h3>
                                <p>
                                    Vị trí: {currentLocation?.lat}, {currentLocation?.lon}
                                </p>
                                <button
                                    className="button--share"
                                    onClick={() => handleShareClick(currentLocation?.lat, currentLocation?.lon)}
                                >
                                    <FaShareAlt />
                                    Chia sẻ
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                )}
                {initialCenter && (
                    <>
                        <Marker position={initialCenter} icon={customIcon}>
                            <Popup>Vị trí trung tâm</Popup>
                        </Marker>
                    </>
                )}
                {listMarker.map((marker) => (
                    <Marker key={marker.id} position={[marker.latitude, marker.longitude]} icon={customIcon}>
                        <Popup>
                            <div>
                                <h3 style={{ fontWeight: 600 }}>{marker.description}</h3>
                                <p style={{ fontSize: 20, fontWeight: 400, margin: '12px 0' }}>
                                    Giá/m²: {formatToVND(marker.priceOnM2)}
                                </p>
                                <button
                                    className="button--detail"
                                    onClick={() => {
                                        setIsDrawerVisible(true);
                                        setSelectedMarker(marker);
                                    }}
                                >
                                    Xem chi tiết
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                {/* {polygon && <Polygon pathOptions={{ fillColor: 'transparent' }} positions={polygon} />} */}
                {selectedMarker && (
                    <DrawerView
                        isDrawerVisible={isDrawerVisible}
                        closeDrawer={closeDrawer}
                        addAt={selectedMarker.addAt}
                        images={selectedMarker.imageLink}
                        description={selectedMarker.description}
                        priceOnM2={selectedMarker.priceOnM2}
                        typeArea={selectedMarker.typeArea}
                        area={selectedMarker.area}
                    />
                )}
                {/* {polygonSessionStorage.length > 0 &&
                    isOverview &&
                    polygonSessionStorage.map((polygon, index) => {
                        return (
                            <Polygon
                                key={index}
                                positions={polygon.geometry.coordinates[0].map((coord) => [coord[1], coord[0]])}
                                color="pink"
                                fillOpacity={0.5}
                                fillColor="pink"
                            />
                        );
                    })} */}
                {/* <Polygon
                    positions={polygon.geometry.coordinates[0].map((coord) => [coord[1], coord[0]])}
                    color="pink"
                    fillOpacity={0.5}
                    fillColor="pink"
                /> */}
                {isOverview &&
                    polygonsData.map((item) => {
                        if (item.type === 'Polygon') {
                            return (
                                <Polygon
                                    positions={item.polygons[0].map((coord) => [coord[1], coord[0]])}
                                    color="pink"
                                    fillOpacity={0.5}
                                    fillColor="pink"
                                />
                            );
                        } else if (item.type === 'MultiPolygon') {
                            return item.polygons.map((coordinates) => (
                                <Polygon
                                    positions={coordinates[0].map((coord) => [coord[1], coord[0]])}
                                    color="pink"
                                    fillOpacity={0.5}
                                    fillColor="pink"
                                />
                            ));
                        } else {
                            return null;
                        }
                    })}
            </MapContainer>
        </>
    );
};

export default memo(Map);
