import { createSlice } from '@reduxjs/toolkit';

const dmMessNotifyReducer = createSlice({
    name: 'dmMessNotifyReducer',
    initialState: {
        dmNotifyArray: [{ key: '', value: 0 }],
        inCommingDMCall: { chatRoom: '', callRoom: '', callFrom: '' },
        inCall: false,
    },
    reducers: {
        setDmNotifyArray: (state, action) => {
            state.dmNotifyArray = action.payload;
        },
        setInCommingDMCall: (state, action) => {
            state.inCommingDMCall = action.payload;
        },
        setInCall: (state, action) => {
            state.inCall = action.payload;
        },
    },
});
export const { setDmNotifyArray, setInCommingDMCall, setInCall, setHaveNewDM } = dmMessNotifyReducer.actions;
export default dmMessNotifyReducer.reducer;
