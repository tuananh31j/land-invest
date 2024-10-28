import axios from 'axios';
import { API_KEYS_MAP, BASE_URL_API_MAP } from '../configs/apiKeyMap';
import { getRandomIntegerBelow } from '../utils/getRandomIntegerBelow';

export const getIdsProvinceByNames = async (names) => {
    const promises = names.map((name) =>
        axios.get(BASE_URL_API_MAP + '/geocode/search', {
            params: {
                apiKey: API_KEYS_MAP[getRandomIntegerBelow(API_KEYS_MAP.length)],
                city: name,
                country: 'Vietnam',
            },
        }),
    );

    const responses = await Promise.all(promises);
    return responses.map((response) => response.data.features[0].properties.place_id);
};
