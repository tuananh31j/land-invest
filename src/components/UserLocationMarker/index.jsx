import { Marker, Popup, useMap } from 'react-leaflet';
import useGetMyLocation from '../Hooks/useGetMyLocation';
import { useEffect } from 'react';

const UserLocationMarker = () => {
    const { lat, lng } = useGetMyLocation();
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 13); // Di chuyển bản đồ đến vị trí của người dùng
        }
    }, [lat, lng, map]);

    // Kiểm tra nếu không có vị trí thì không render Marker
    if (!lat || !lng) return null;

    return (
        <Marker position={[lat, lng]}>
            <Popup>Bạn đang ở đây</Popup>
        </Marker>
    );
};

export default UserLocationMarker;
