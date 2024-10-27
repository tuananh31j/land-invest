import axios from 'axios';
import { fetchDistrictsByProvinces, fetchProvinces } from '../services/api';

function getRandomIntegerBelow(num) {
    return Math.floor(Math.random() * num);
}

const keys = [
    'defeada8b12748d3948489bef4c89e2a',
    'dcde3e57f5ea47c2bdf903f481b0d220',
    'da169c1e7ebd4bc5b861fcac0a162ab3',
    'f16a2e5a33f248cb8d70411d16249e01',
    '4b0e71023b12467ab7b4fae77b836f2f',
    'b2c5c6af51ac4b1789392d421dd1fb1e',
    '82988de2114b4bf197c98166ddd0bd86',
    'ac804a1dbfd5438eaa785354cecc7e03',
    '26db09a649754e0a97d5dc20ac1060b5',
    'c06c3c657cf74bd2bf5fcd4215e7d552',
];
const API_URL = 'https://api.geoapify.com/v1/geocode/reverse';
const fetchProvinceName = async (lat, lon) => {
    try {
        if (lat && lon) {
            const response = await axios.get(API_URL, {
                params: {
                    apiKey: keys[getRandomIntegerBelow(keys.length)],
                    lat,
                    lon,
                    type: 'city',
                },
            });

            const address = response.data.features[0].properties;
            let provinceName = address.state || address.province || address.city;
            let districtName =
                address.county ||
                address.district ||
                address.city_district ||
                address.suburb ||
                address.town ||
                address.village ||
                address.formatted.split(',')[0];

            if (districtName) {
                districtName = districtName.replace(/district/i, '').trim();
            }

            if (provinceName) {
                provinceName = provinceName.replace(/province/i, '').trim();
            }
            return { provinceName, districtName } || 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching province name:', error);
        return 'Unknown';
    }
};

export const getProvince = async (provinceName) => {
    const provincesList = await fetchProvinces();
    const province = provincesList.find(
        (province) => province.TenTinhThanhPho.toLowerCase() === provinceName.toLowerCase(),
    );
    return province || null;
};

export const getDistrict = async (provinceId) => {
    const districtsList = await fetchDistrictsByProvinces(provinceId);
    return districtsList || null;
};

export default fetchProvinceName;
