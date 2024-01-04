import { createSlice } from '@reduxjs/toolkit';
import jwtDecode from 'jwt-decode';
import { getAuth } from 'firebase/auth';
import app from '../../configs/firebase';

const UToken = localStorage.getItem('userToken');
const credentialData = localStorage.getItem('credentialData');

function verifyToken(keyName) {
    const storage = localStorage.getItem(keyName);
    if (storage) {
        const decodeToken = jwtDecode(storage);
        const expiresIn = new Date(decodeToken.exp);
        if (new Date() > expiresIn) {
            if (getAuth(app).currentUser) {
                getAuth(app)
                    .currentUser.getIdToken(true)
                    .then((IdToken) => {
                        setUserToken(IdToken);
                    });
            }
            localStorage.removeItem(keyName);
            return null;
        } else {
            return storage;
        }
    } else {
        return null;
    }
}
const authReducer = createSlice({
    name: 'authReducer',
    initialState: {
        adminToken: verifyToken('admin-token'),
        userToken: verifyToken('userToken'),
        user: UToken ? jwtDecode(UToken) : null,
        credential: credentialData ? credentialData : null,
    },
    reducers: {
        setAdminToken: (state, action) => {
            state.adminToken = action.payload;
        },
        setUserToken: (state, action) => {
            state.userToken = action.payload;
            state.user = jwtDecode(action.payload);
        },
        setCredentialData: (state, action) => {
            state.credential = action.payload;
        },
        logout: (state, { payload }) => {
            localStorage.removeItem(payload);
            if (payload === 'admin-token') {
                state.adminToken = null;
            } else if (payload === 'userToken') {
                state.userToken = null;
                state.user = null;
            }
            localStorage.removeItem('credentialData');
            getAuth(app).signOut();
        },
    },
});
export const { setAdminToken, setUserToken, logout, setCredentialData } = authReducer.actions;
export default authReducer.reducer;
