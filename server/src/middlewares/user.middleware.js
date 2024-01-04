require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');

class UserMiddleware {
    RemoveNotify(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const notifyId = req.body.notifyId;
        admin.db
            .collection('users')
            .doc(decodedIdToken.user_id)
            .collection('notifyList')
            .doc(notifyId)
            .delete()
            .then(() => {
                res.status(200).send(JSON.stringify('OK !'));
            })
            .catch((error) => {
                res.status(500).send('Internal Server Error');
            });
    }
}

module.exports = new UserMiddleware();
