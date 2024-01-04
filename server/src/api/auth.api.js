require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');
const UserModel = require('../models/user.model');
const defaultAvtImg =
    'https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/systemStorage%2Fdefault-user-image.png?alt=media&token=4ab3a931-55af-4c57-98d7-5fb9f82850a2';

class AuthApi {
    // [POST] api/auth/login
    async UserTokenVerify(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        if (decodedIdToken.email_verified) {
            res.send(JSON.stringify({ status: 'user login success' }));
        } else {
            res.status(401).send('Your email is not verified');
        }
    }

    // [POST] api/auth/adminlogin
    async AdminTokenVerify(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        if (decodedIdToken.email_verified) {
            res.send(JSON.stringify({ status: 'admin login success' }));
        } else {
            res.status(401).send('UNAUTHORIZED REQUEST!');
        }
    }

    // [POST] api/auth/register
    async Register(req, res, next) {
        const decodedIdToken = await req.body.decodedIdToken;
        const newName = await req.body.newName;
        const newUser = new UserModel(decodedIdToken.user_id, defaultAvtImg, newName, false, false);
        admin.db
            .collection('users')
            .doc(decodedIdToken.user_id)
            .set(newUser)
            .then(() => {
                try {
                    const storageRef = admin.storage.bucket().file(`userStorage/${decodedIdToken.user_id}/`);
                    storageRef.createWriteStream().end();
                    res.status(200).send('created user successfully !');
                } catch (err) {
                    res.status(500).send(err.message);
                }
            })
            .catch((err) => {
                res.status(500).send(err.message);
                console.log(err);
            });
    }

    // [POST] api/auth/logout
    async Logout(req, res, next) {
        res.clearCookie('sessionCookie');
        res.json({ message: 'user logout' });
    }
}

module.exports = new AuthApi();
