import { createSlice } from '@reduxjs/toolkit';

const urlScannerReducer = createSlice({
    name: 'urlScannerReducer',
    initialState: {
        _url: null,
    },
    reducers: {
        setURL: (state, action) => {
            state._url = action.payload;
        },
    },
});
export const { setURL } = urlScannerReducer.actions;
export default urlScannerReducer.reducer;
