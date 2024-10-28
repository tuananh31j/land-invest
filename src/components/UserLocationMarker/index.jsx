import { Marker, Popup } from 'react-leaflet';
import useGetMyLocation from '../Hooks/useGetMyLocation';
import { useEffect } from 'react';
import useGetParams from '../Hooks/useGetParams';
import { useDispatch } from 'react-redux';
import { backToMyLocation } from '../../redux/search/searchSlice';
import fetchProvinceName from '../../function/findProvince';

const UserLocationMarker = () => {
    const { lat, lng } = useGetMyLocation();
    const searchParams = useGetParams();
    const currentPositon = searchParams.get('vitri') ? searchParams.get('vitri').split(',') : [];
    const dispatch = useDispatch();
    useEffect(() => {
        (async () => {
            const hasPositon = currentPositon.length === 2;
            if (lat && lng && !hasPositon) {
                const info = await fetchProvinceName(lat, lng);
                dispatch(
                    backToMyLocation({
                        lat,
                        lon: lng,
                        provinceName: info.provinceName,
                        districtName: info.districtName,
                    }),
                );
            }
        })();
    }, [lat, lng]);

    // Kiểm tra nếu không có vị trí thì không render Marker
    if (!lat || !lng) return null;

    return (
        <Marker position={[lat, lng]}>
            <Popup>Bạn đang ở đây</Popup>
        </Marker>
    );
};

export default UserLocationMarker;
