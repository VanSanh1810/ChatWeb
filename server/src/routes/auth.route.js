const express = require('express');
const route = express.Router();

const authApi = require('../api/auth.api');
const authMiddleware = require('../middlewares/auth.middleware')

route.post('/login', authMiddleware.VerifyIdToken ,authApi.UserTokenVerify);
route.post('/register', authMiddleware.VerifyIdToken, authApi.Register);

module.exports = route;