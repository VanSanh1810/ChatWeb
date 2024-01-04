require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); //https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
const app = express();
const route = require('./routes');

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_URL,
    },
});
const ChatSocketServices = require('./services/chatSocket.service');

//Declare __io for socket.io services
global.__io = io;

const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const csrfMiddleware = csrf({ cookie: true });

//Use Cross-origin resource sharing (CORS)
const corsOptions = {
    origin: process.env.CLIENT_URL, //List origins site-defined
    credentials: true,
};
app.use(cors(corsOptions));

app.use(cookieParser());
//Read form data so web can access req.body contents
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// if (process.env.NODE_ENV === 'production') {
//     app.use(csrfMiddleware);

//     //when we first load the page, we get the XSRF token from the Client
//     app.all('*', (req, res, next) => {
//         res.cookie('XSRF-TOKEN', req.csrfToken(), { sameSite: 'none', secure: true });
//         next();
//     });

//     app.get('/csrf', (req, res) => {
//         res.send({ csrfToken: req.csrfToken() });
//     });
// }

//Routes init
route(app);

if (process.env.NODE_ENV === 'production') {
    //Static files
    // app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.static(path.join(__dirname, '/build/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'build', 'dist', 'index.html'));
    });
}

//Set socket connection when first connect to server
global.__io.on('connection', ChatSocketServices.connection);

const port = process.env.PORT || 4000;

server.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
