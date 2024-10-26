import { createApi } from '@reduxjs/toolkit/query/react';
import { QUERY_KEY } from '../../constants/queryKey';
import baseQuery from './baseQuery';

const tags = Object.values(QUERY_KEY);

const baseApi = createApi({
    reducerPath: 'API',
    tagTypes: [...tags],
    baseQuery,
    endpoints: () => ({}),
});

export default baseApi;
