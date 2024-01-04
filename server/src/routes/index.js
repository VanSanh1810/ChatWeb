const authRouter = require('./auth.route');
const testRouter = require('./test.route');
const userRouter = require('./user.route');
const chatRouter = require('./chat.route');
const serverRouter = require('./server.route');
const permRoute = require('./permission.route');
const exResourse = require('./externalResourse.route');

function route(app) {
    app.use('/test', testRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/chat', chatRouter);
    app.use('/api/server', serverRouter);
    app.use('/api/permission', permRoute);
    app.use('/api/externalResourse', exResourse);
    app.use('/api', userRouter);
}

module.exports = route;
