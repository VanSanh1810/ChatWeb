import { createSlice } from '@reduxjs/toolkit';

const chatReducer = createSlice({
    name: 'chatReducer',
    initialState: {
        selectedChatData: { chatId: '', userChatId: '' },
        selectedViewMedia: { mediaURL: '', type: '' },
    },
    reducers: {
        setSelectedChatData: (state, action) => {
            state.selectedChatData = action.payload;
        },
        clearSelectedChatData: (state, action) => {
            state.selectedChatData = { chatId: '', userChatId: '' };
        },
        setSelectedViewMedia: (state, action) => {
            state.selectedViewMedia = action.payload;
        },
        clearSelectedViewMedia: (state, action) => {
            state.selectedViewMedia = { mediaURL: '', type: '' };
        },
    },
});
export const { setSelectedChatData, clearSelectedChatData, setSelectedViewMedia, clearSelectedViewMedia} = chatReducer.actions;
export default chatReducer.reducer;
