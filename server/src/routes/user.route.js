const express = require('express');
const route = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userApi = require('../api/user.api');

route.post('/userInterractAction', authMiddleware.VerifyIdToken, userApi.userInterractAction);
route.post('/getUserById', authMiddleware.VerifyIdToken, userApi.getUserDataById);
route.post('/getUser', authMiddleware.VerifyIdToken, userApi.getUserData);
route.post('/getUsers', authMiddleware.VerifyIdToken, userApi.getUsersData);
route.put('/setUser', authMiddleware.VerifyIdToken, userApi.setUserData);
route.post('/notifyMarkAtRead', authMiddleware.VerifyIdToken, userApi.markAtRead);
route.post('/deleteNotify', authMiddleware.VerifyIdToken, userApi.deleteNotify);

module.exports = route;
