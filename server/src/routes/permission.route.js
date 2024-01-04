const express = require('express');
const route = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const permMiddleware = require('../middlewares/permission.middleware');

route.post('/checkChannelPerm', authMiddleware.VerifyIdToken , permMiddleware.CheckChannelPermission);
route.post('/checkServerPerm', authMiddleware.VerifyIdToken , permMiddleware.CheckServerPermission);

module.exports = route;