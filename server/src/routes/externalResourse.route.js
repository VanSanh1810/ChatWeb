const express = require('express');
const route = express.Router();

const urlApi = require('../api/urlScanner.api');
const authMiddleware = require('../middlewares/auth.middleware');

route.post('/scanUrl', authMiddleware.VerifyIdToken, urlApi.URLScanner);

module.exports = route;
