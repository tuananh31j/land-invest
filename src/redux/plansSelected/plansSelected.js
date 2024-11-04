import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    quyhoach: [],
};

export const searchQuery = createSlice({
    name: 'plansSelected',
    initialState,
    reducers: {
        setQuyHoachIds: (state, action) => {
            state.quyhoach = action.payload;
        },
    },
});

export const { setQuyHoachIds } = searchQuery.actions;
export default searchQuery;
