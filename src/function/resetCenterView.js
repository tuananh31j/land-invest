import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
export default function ResetCenterView({ lat, lon, zoom }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lon) {
            map.setView(L.latLng(lat, lon), zoom || map.getZoom(), {
                animate: true,
            });
        }
    }, [lat, lon]);
}
