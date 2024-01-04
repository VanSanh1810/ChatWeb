const express = require('express');
const route = express.Router();

const authApi = require('../api/auth.api');
const authMiddleware = require('../middlewares/auth.middleware');
const chatApi = require('../api/chat.api');

route.put('/confirmSeenDM', authMiddleware.VerifyIdToken , chatApi.SeenChatConfirm);

module.exports = route;