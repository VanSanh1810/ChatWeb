require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');
const UserModel = require('../models/user.model');
const defaultAvtImg =
    'https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/systemStorage%2Fdefault-user-image.png?alt=media&token=4ab3a931-55af-4c57-98d7-5fb9f82850a2';

class ChatApi {
    // [PUT] api/chat/confirmSeenDM
    async SeenChatConfirm(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const chatCollectionRef = admin.db.collection('chatLists').doc(req.body.chatId);
        await chatCollectionRef
            .collection('messages')
            .where('sendBy', '!=', decodedIdToken.user_id)
            .where('isSeen', '==', false)
            .get()
            .then((querySnapShot) => {
                const batch = admin.db.batch();
                querySnapShot.forEach((doc) => {
                    const docRef = chatCollectionRef.collection('messages').doc(doc.id);
                    batch.update(docRef, { isSeen: true });
                });
                batch.commit();
                chatCollectionRef.update({
                    isSeen: admin.admin.firestore.FieldValue.arrayUnion(decodedIdToken.user_id)
                })
            });
        res.status(200).send('Successfully');
    }
}

module.exports = new ChatApi();
