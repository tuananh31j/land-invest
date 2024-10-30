import axios from 'axios';
import { API_KEYS_MAP } from '../configs/apiKeyMap';
import { getRandomIntegerBelow } from '../utils/getRandomIntegerBelow';
import * as turf from '@turf/turf';

export const getBoundaries = async (ids) => {
    const boundaryPromises = ids.map((id, i) => {
        return axios.get('https://api.geoapify.com/v1/boundaries/part-of', {
            params: {
                id: id,
                apiKey: API_KEYS_MAP[getRandomIntegerBelow(API_KEYS_MAP.length)],
                geometry: 'geometry_1000',
            },
        });
    });
    const boundaryPromises2 = ids.map((id, i) => {
        return axios.get('https://api.geoapify.com/v1/boundaries/consists-of', {
            params: {
                id: id,
                apiKey: API_KEYS_MAP[getRandomIntegerBelow(API_KEYS_MAP.length)],
                geometry: 'geometry_1000',
            },
        });
    });

    const boundaries = await Promise.all(boundaryPromises.filter((promise) => promise !== null));
    const boundaries2 = await Promise.all(boundaryPromises2.filter((promise) => promise !== null));
    let ok = boundaries.map((response) => {
        return response.data.features
            .map((feature) => {
                if (feature.geometry.type === 'Polygon') {
                    return turf.polygon([feature.geometry.coordinates[0]]);
                }
                return null;
            })
            .filter((coordinates) => coordinates !== null);
    });
    let ok2 = boundaries2.map((response) => {
        return response.data.features
            .map((feature) => {
                if (feature.geometry.type === 'Polygon') {
                    return turf.polygon([feature.geometry.coordinates[0]]);
                }
                return null;
            })
            .filter((coordinates) => coordinates !== null);
    });
    ok = ok.filter((item) => item.length > 0);
    ok2 = ok2.filter((item) => item.length > 0);

    return [...ok.flat(), ...ok2.flat()];
};
