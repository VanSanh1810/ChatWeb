import { createSlice } from '@reduxjs/toolkit';

const serverReducer = createSlice({
    name: 'serverReducer',
    initialState: {
        serverSelect: null,
        serverOwner: null,
        isHaveAdminPermission: false,
        roomSelect: { channelId: '', roomId: '', roomType: '' },
    },
    reducers: {
        setServerSelect: (state, action) => {
            state.serverSelect = action.payload;
        },
        setServerOwner: (state, action) => {
            state.serverOwner = action.payload;
        },
        setRoomSelect: (state, action) => {
            state.roomSelect = action.payload;
        },
        setIsHaveAdminPermission: (state, action) => {
            state.isHaveAdminPermission = action.payload;
        },
    },
});
export const { setServerSelect, setRoomSelect, setServerOwner, setIsHaveAdminPermission } = serverReducer.actions;
export default serverReducer.reducer;
