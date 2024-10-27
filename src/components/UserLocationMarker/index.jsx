import { Marker, Popup, useMap } from 'react-leaflet';
import useGetMyLocation from '../Hooks/useGetMyLocation';
import { useEffect } from 'react';
import useGetParams from '../Hooks/useGetParams';

const UserLocationMarker = () => {
    const { lat, lng } = useGetMyLocation();
    const searchParams = useGetParams();
    const currentPositon = searchParams.get('vitri') ? searchParams.get('vitri').split(',') : [];
    const map = useMap();

    useEffect(() => {
        const hasPositon = currentPositon.length === 2;
        if (lat && lng && !hasPositon) {
            map.setView([lat, lng], 13); // Di chuyển bản đồ đến vị trí của người dùng
        }
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
