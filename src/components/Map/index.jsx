import React, { memo, useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    Polygon,
    LayersControl,
    Pane,
} from 'react-leaflet';
import L from 'leaflet';
import DrawerView from '../Home/DrawerView';
import fetchProvinceName, { getProvince } from '../../function/findProvince';
import { findClosestDistrict } from '../../function/findClosestDistrict';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ResetCenterView from '../../function/resetCenterView';
import { selectFilteredMarkers } from '../../redux/filter/filterSelector';
import { formatToVND } from '../../function/formatToVND';
import { setListMarker } from '../../redux/listMarker/listMarkerSllice';
import useMapParams from '../../hooks/useMapParams';
import { FaShareAlt } from 'react-icons/fa';
import { message } from 'antd';
import { fetchListInfo, fetQuyHoachByIdDistrict, searchLocation } from '../../services/api';
import { setDistrictId } from '../../redux/planMap/planMapSlice';

const customIcon = new L.Icon({
    iconUrl: require('../../assets/marker.png'),
    iconSize: [38, 38],
    iconAnchor: [22, 38],
    popupAnchor: [-3, -38],
});

const Map = ({
    opacity,
    handleSetProvinceName,
    setSelectedPosition,
    selectedPosition,
    setIdDistrict,
    idDistrict,
}) => {
    const [idProvince, setIdProvince] = useState();
    const [polygon, setPolygon] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [selectedIDQuyHoach, setSelectedIDQuyHoach] = useState(null);
    const [locationInfo, setLocationInfo] = useState();

    const locationLink = useLocation();
    const dispatch = useDispatch();
    const listMarker = useSelector(selectFilteredMarkers);
    const { coordinates } = useSelector((state) => state.searchQuery.searchResult);

    const [messageApi, contextHolder] = message.useMessage();
    const [quyhoachIds, setQuyhoachIds] = useState([]);
    const [position, setPosition] = useState([]);
        useEffect(() => {
            const newQuyhoachIds =
                new URLSearchParams(locationLink.search)
                    .get('quyhoach')
                    ?.split(',')
                    .map((id) => parseInt(id, 10)) || [];

            setQuyhoachIds(newQuyhoachIds);
        }, [locationLink.search]);

    const closeDrawer = () => setIsDrawerVisible(false);

    const { initialCenter, initialZoom } = useMapParams();
    useEffect(() => {
        const searchParams = new URLSearchParams(locationLink.search);
        const vitri = searchParams.get('vitri');
        vitri && vitri.length > 0 && setPosition(vitri.split(',').map(Number));
    }, [locationLink.search]);


    useEffect(() => {
        if (position.length === 2) {
            const map = document.querySelector('.leaflet-container')?.leafletElement;
            if (map) {
                map.setView(position);
            }
        }
    }, [position]);
    const MapEvents = () => {
        const map = useMapEvents({
            moveend: async (e) => {
                const map = e.target;
                const center = map.getCenter();
                const zoom = map.getZoom();

                const searchParams = new URLSearchParams(locationLink.search);
                searchParams.set('vitri', `${center.lat},${center.lng}`);
                searchParams.set('zoom', `${zoom}`);

                const newUrl = `${locationLink.pathname}?${searchParams.toString()}`;
                window.history.replaceState({}, '', newUrl);

                if (map.getZoom() >= 8) {
                    const locationInfo = await fetchProvinceName(center.lat, center.lng);
                    // const res = await getProvince(locationInfo.provinceName);
                    // const data = await findClosestDistrict(res.TinhThanhPhoID, locationInfo.districtName);
                    // if (data.found) {
                    //     setIdProvince(data.districtId);
                    //     // dispatch(setDistrictId(data.districtId));
                    // } else {
                    //     console.log(data.message);
                    // }

                    try {
                        const res = await searchLocation(locationInfo?.districtName);
                        res ? setIdProvince(res.idDistrict) : setIdDistrict(null);
                    } catch (error) {
                        setIdDistrict(null);
                    }
                }
            },
            click: async (e) => {
                const { lat, lng } = e.latlng;
                map.setView([lat, lng]);
                setSelectedPosition({ lat, lng });
                const info = await fetchProvinceName(lat, lng);
                handleSetProvinceName(info);

                setLocationInfo({ districtName: info.districtName, provinceName: info.provinceName, lat, lng });

                try {
                    const res = await searchLocation(info?.districtName);
                    res ? setIdDistrict(res.idDistrict) : setIdDistrict(null);
                } catch (error) {
                    setIdDistrict(null);
                }
            },
        });
        return null;
    };

    useEffect(() => {
        setPolygon(
            coordinates && coordinates.length > 0 && Array.isArray(coordinates[0])
                ? coordinates[0].map((coord) => [coord[1], coord[0]])
                : null,
        );
    }, [coordinates]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await fetQuyHoachByIdDistrict(idDistrict);
                if (data && data.length > 0) {
                    setSelectedIDQuyHoach(data[0]?.id);
                } else {
                    setSelectedIDQuyHoach(null);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setSelectedIDQuyHoach(null);
            }
        };

        fetchData();
    }, [idDistrict]);

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
    }, [dispatch, idProvince]);

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

    return (
        <>
            {contextHolder}
            <MapContainer
                style={{ width: '100%', height: 'calc(100vh - 56px)' }}
                center={initialCenter}
                zoom={initialZoom}
                maxZoom={30}
            >
                <MapEvents />
                {position && position.length === 2 && <ResetCenterView lat={position[0]} lon={position[1]} />}
                {/* {
                    kinhtuyen && vituyen && (
                       <>
                            <Marker position={[kinhtuyen, vituyen]} icon={customIcon}>
                                <Popup>Vị trí bạn tìm kiếm</Popup>
                            </Marker>
                            {hasRendered && <ResetCenterView lat={kinhtuyen} lon={vituyen} />}
                       </>
                    )
                } */}
                <LayersControl>
                    <LayersControl.BaseLayer checked name="Map vệ tinh">
                        <TileLayer
                            url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                            maxZoom={30}
                            attribution="&copy; <a href='https://www.google.com/maps'>Google Maps</a> contributors"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Map mặc định">
                        <TileLayer
                            maxZoom={22}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                <Pane name="PaneThai" style={{ zIndex: 650 }}>
                    {quyhoachIds.map((item, index) => (
                        <TileLayer
                            key={index}
                            url={`https://apilandinvest.gachmen.org/get_api_quyhoach/${item}/{z}/{x}/{y}`}
                            pane="overlayPane"
                            minZoom={12}
                            maxZoom={18}
                            opacity={opacity}
                          
                        />
                    ))}
                    {selectedIDQuyHoach && (
                        <TileLayer
                            url={`https://apilandinvest.gachmen.org/get_api_quyhoach/${selectedIDQuyHoach}/{z}/{x}/{y}`}
                            pane="overlayPane"
                            minZoom={12}
                            maxZoom={18}
                            opacity={opacity}
                          
                        />
                    )}
                </Pane>
                {selectedPosition && locationInfo && (
                    <Marker position={selectedPosition} icon={customIcon}>
                        <Popup>
                            <div>
                                <h3 style={{ fontWeight: 600 }}>
                                    Tỉnh {locationInfo?.provinceName}, Huyện {locationInfo?.districtName}
                                </h3>
                                <p>
                                    Vị trí: {locationInfo?.lat.toFixed(5)}, {locationInfo?.lng.toFixed(5)}
                                </p>
                                <button
                                    className="button--share"
                                    onClick={() => handleShareClick(locationInfo?.lat, locationInfo?.lng)}
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
                {polygon && <Polygon pathOptions={{ fillColor: 'transparent' }} positions={polygon} />}
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
            </MapContainer>
        </>
    );
};

export default memo(Map);