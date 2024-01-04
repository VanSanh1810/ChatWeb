const admin = require('firebase-admin');

var serviceAccount = require('./chatapp-b90a5-firebase-adminsdk-ugl1c-bd9b191eab.json');

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'chatapp-b90a5.appspot.com',
});

const db = admin.firestore(app);
const auth = admin.auth(app);
const storage = admin.storage(app);
module.exports = { app, db, auth, storage, admin};