const express = require('express');
const route = express.Router();

const authApi = require('../api/auth.api');
const testMiddleware = require('../middlewares/test.middleware')

route.post('/test', testMiddleware.VerifySessionCookie);

module.exports = route;