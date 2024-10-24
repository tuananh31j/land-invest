import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
export default function ResetCenterView({lat, lon  }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lon) {
            map.setView(L.latLng(lat, lon), map.getZoom(), {
                animate: true,
            });
        }
    }, [lat, lon]);
}
