require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');

class AuthMiddleware {
    async VerifyIdToken(req, res, next) {
        const idToken = req.body.idToken?.toString();
        if (idToken) {
            admin.auth
                .verifyIdToken(idToken, true /** checkRevoked */)
                .then((decodedIdToken) => {
                    if (decodedIdToken.email_verified || req.body.authType === 'register') {
                        req.body.decodedIdToken = decodedIdToken;
                        next();
                    }else{
                        res.status(401).send('UNAUTHORIZED REQUEST!' + "Your email is not verified!");
                    }
                })
                .catch((error) => {
                    res.status(401).send('UNAUTHORIZED REQUEST!' + error.message);
                });
        }else{
            res.status(401).send('UNAUTHORIZED REQUEST!');
        }
    }

    async VerifyAdminToken(req, res, next) {
        const idToken = req.body.decodedIdToken;
        admin.db.collection('users').doc(decodedIdToken);
    }
}

module.exports = new AuthMiddleware();
