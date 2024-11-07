import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    quyhoach: [],
};

export const searchQuery = createSlice({
    name: 'plansSelected',
    initialState,
    reducers: {
        setPlansInfo: (state, action) => {
            state.quyhoach = action.payload;
        },
    },
});

export const { setPlansInfo } = searchQuery.actions;
export default searchQuery;
