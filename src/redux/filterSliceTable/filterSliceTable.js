import { createSlice } from '@reduxjs/toolkit';

const initialState = { query: {} };
const filterSliceTable = createSlice({
    name: 'filterSliceTable',
    initialState,
    reducers: {
        setQuery: (state, action) => {
            state.query = action.payload;
        },
    },
});

export const { setQuery } = filterSliceTable.actions;
export default filterSliceTable;
