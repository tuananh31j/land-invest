import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import useMapParams from "../hooks/useMapParams";
import L from 'leaflet';

const MapController = ({ lat, lon }) => {
    const map = useMap();
    const [initialCenterSet, setInitialCenterSet] = useState(false);
    const { initialCenter, initialZoom } = useMapParams();
  
    map.setView(L.latLng(lat, lon), map.getZoom(), {
        animate: true,
    });
    useEffect(() => {
      if (!initialCenterSet) {
        map.setView(L.latLng(initialCenter[0], initialCenter[1]), initialZoom, {
            animate: true,
        });
        setInitialCenterSet(true);
      } else if (lat && lon) {
        map.setView([lat, lon]);
      }
    }, [map, lat, lon, initialCenter, initialZoom, initialCenterSet]);
  
    return null;
  };

  export default MapController;