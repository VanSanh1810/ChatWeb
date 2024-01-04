require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');

class TestMiddleware {
    VerifySessionCookie(req, res, next) {
        const idToken = req.body.idToken || '';
        admin.auth.verifyIdToken(idToken , true /** checkRevoked */)
            .then(async (userData) => {
                req._uid = userData.uid; //*
                req.email = userData.email;
                console.log(req.email + req._uid);
                res.send({message : "pass"});
            })
            .catch((error) => {
                res.status(401).send('UNAUTHORIZED REQUEST!' + error.message);
                console.log(error.message);
            });
    }
}

module.exports = new TestMiddleware();