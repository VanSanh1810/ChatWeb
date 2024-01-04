import { createSlice } from '@reduxjs/toolkit';

export const toastType = {
    none: 0,
    info: 1,
    success: 2,
    warning: 3,
    error: 4,
    default: 5,
};

const toastReducer = createSlice({
    name: 'toastReducer',
    initialState: {
        toastState: { Tstate: toastType.none, Tmessage: ''},
    },
    reducers: {
        setToastState: (state, action) => {
            state.toastState = action.payload;
        },
        clearToastState: (state, action) => {
            state.toastState = { Tstate: toastType.none, Tmessage: ''};
        },
    },
});
export const { setToastState, clearToastState } = toastReducer.actions;
export default toastReducer.reducer;
