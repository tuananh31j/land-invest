import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: 'https://nominatim.openstreetmap.org/reverse',
    prepareHeaders: (headers) => {
        return headers;
    },
});

export default baseQuery;
