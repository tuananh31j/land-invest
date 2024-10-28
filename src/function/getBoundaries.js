import axios from 'axios';
import { API_KEYS_MAP, BASE_URL_API_MAP } from '../configs/apiKeyMap';
import { getRandomIntegerBelow } from '../utils/getRandomIntegerBelow';

export const getBoundaries = async (ids) => {
    const boundaryPromises = ids.map((id) =>
        axios.get(BASE_URL_API_MAP + '/boundaries/consists-of', {
            params: {
                id: id,
                apiKey: API_KEYS_MAP[getRandomIntegerBelow(API_KEYS_MAP.length)],
                geometry: 'geometry_1000',
            },
        }),
    );

    const boundaries = await Promise.all(boundaryPromises);
    // console.log(boundaries, 'boundaries');
    return boundaries
        .map((response) => {
            return response.data.features
                .map((feature) => {
                    if (feature.geometry.type === 'Polygon') {
                        return feature.geometry.coordinates[0].map((coordinate) => [coordinate[1], coordinate[0]]);
                    }
                    return null; // Ensure a value is always returned
                })
                .filter((coordinates) => coordinates !== null); // Filter out null values
        })
        .filter((item) => item.length > 0);
};
