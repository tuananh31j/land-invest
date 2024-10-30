import axios from 'axios';
import { API_KEYS_MAP, BASE_URL_API_MAP } from '../configs/apiKeyMap';
import { getRandomIntegerBelow } from '../utils/getRandomIntegerBelow';

export const getIdsProvinceByBoundingCenter = async (dataSearch) => {
    const promises = dataSearch.map((item) =>
        axios.get(BASE_URL_API_MAP + '/geocode/search', {
            params: {
                apiKey: API_KEYS_MAP[getRandomIntegerBelow(API_KEYS_MAP.length)],
                country: 'Vietnam',
                city: item.TenTinhThanhPho,
            },
        }),
    );

    const responses = await Promise.all(promises.flat());
    console.log(responses, 'responses');
    return responses.map((response) => response.data.features[0].properties.place_id);
};
