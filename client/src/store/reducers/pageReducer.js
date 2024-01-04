import { createSlice } from '@reduxjs/toolkit';

export const pages = {
    main: 0,
    profile: 1,
    notify: 2,
    search: 3,
    games: 4,
    server: 5,
}

const pageReducer = createSlice({
    name: 'pageReducer',
    initialState: {
        pageToken: pages.main,
    },
    reducers: {
        setPage: (state, action) => {
            state.pageToken = action.payload;
        },
    },
});
export const { setPage } = pageReducer.actions;
export default pageReducer.reducer;