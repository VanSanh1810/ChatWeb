import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './reducers/authReducer';
import pageReducer from './reducers/pageReducer';
import toastReducer from './reducers/toastReducer';
import chatReducer from './reducers/chatReducer';
import { combineReducers } from 'redux';
import dmMessNotifyReducer from './reducers/dmMessNotifyReducer';
import serverReducer from './reducers/serverReducer';
import urlScannerReducer from './reducers/urlScannerReducer';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['authReducer'],
};

const rootReducer = combineReducers({
    authReducer: authReducer,
    pageReducer: pageReducer,
    toastReducer: toastReducer,
    chatReducer: chatReducer,
    dmMessNotifyReducer: dmMessNotifyReducer,
    serverReducer: serverReducer,
    urlScannerReducer: urlScannerReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: {
        persistedReducer,
    },
});

export const persistor = persistStore(store);
