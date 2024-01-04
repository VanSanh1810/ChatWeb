require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');
const UserModel = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

class UserApi {
    // [POST] api/getUser
    async getUserData(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        if (decodedIdToken.email_verified) {
            admin.db
                .collection('users')
                .doc(decodedIdToken.user_id)
                .get()
                .then(async (data) => {
                    const reqData = await data.data();
                    console.log(reqData);
                    res.status(200).send(JSON.stringify(reqData));
                })
                .catch((err) => {
                    res.status(500).send('Server error: ' + err.message);
                });
        } else {
            res.status(401).send('UNAUTHORIZED REQUEST!' + 'Your email is not verified');
        }
    }

    // [PUT] api/setUser
    async setUserData(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        if (decodedIdToken.email_verified) {
            let downloadUrl = '';
            const storage = admin.storage;
            const bucket = storage.bucket();
            const fileName = `userStorage/${decodedIdToken.user_id}/${decodedIdToken.user_id}`;
            await bucket
                .file(fileName)
                .getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500', // Đặt ngày hết hạn xa về tương lai
                })
                .then(async (signedUrls) => {
                    downloadUrl = signedUrls[0];
                    const newName = await req.body.newName;
                    if (newName) {
                        await admin.db
                            .collection('users')
                            .doc(decodedIdToken.user_id)
                            .update({
                                name: newName,
                                img: downloadUrl,
                            })
                            .then(() => {
                                res.status(200).send('Success');
                            })
                            .catch((error) => {
                                res.status(500).send('UNAUTHORIZED REQUEST!' + error.message);
                            });
                    } else {
                        await admin.db
                            .collection('users')
                            .doc(decodedIdToken.user_id)
                            .update({
                                img: downloadUrl,
                            })
                            .then(() => {
                                res.status(200).send('Success');
                            })
                            .catch((error) => {
                                res.status(500).send('UNAUTHORIZED REQUEST!' + error.message);
                            });
                    }
                })
                .catch((error) => {
                    res.status(500).send('UNAUTHORIZED REQUEST!' + error.message);
                });
        } else {
            res.status(401).send('UNAUTHORIZED REQUEST!' + 'Your email is not verified');
        }
    }

    // [POST] api/getUsers
    async getUsersData(req, res, next) {
        const decodedIdToken = await req.body.decodedIdToken;
        const blockBy = [];
        await admin.db
            .collection('users')
            .doc(decodedIdToken.user_id)
            .collection('blockByList')
            .get()
            .then(async (querySnapshot) => {
                Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        blockBy.push(doc.id);
                        return doc.id;
                    }),
                )
                    .then(async () => {
                        const searchData = await req.body.searchData;
                        const reqData = [];
                        const queryByKey = admin.db.collection('users').where('userID', '==', searchData.trim());
                        queryByKey
                            .get()
                            .then(async (results) => {
                                if (!results.empty) {
                                    const searchResPromise = Promise.all(
                                        results.docs.map((doc) => {
                                            if (doc.id !== decodedIdToken.user_id && !blockBy.includes(doc.id)) {
                                                const userData = doc.data();
                                                reqData.push(userData);
                                            }
                                            return doc.id;
                                        }),
                                    );
                                    await Promise.all([searchResPromise]);
                                    res.status(200).send(JSON.stringify(reqData));
                                } else {
                                    const query = admin.db
                                        .collection('users')
                                        .where('name', '>=', searchData)
                                        .where('name', '<=', searchData + '\uf8ff');
                                    query
                                        .get()
                                        .then(async (querySnapshot) => {
                                            const searchResPromise = Promise.all(
                                                querySnapshot.docs.map((doc) => {
                                                    if (doc.id !== decodedIdToken.user_id && !blockBy.includes(doc.id)) {
                                                        const userData = doc.data();
                                                        reqData.push(userData);
                                                    }
                                                    return doc.id;
                                                }),
                                            );
                                            await Promise.all([searchResPromise]);
                                            res.status(200).send(JSON.stringify(reqData));
                                        })
                                        .catch((error) => {
                                            console.log('Lỗi khi truy vấn dữ liệu: ', error);
                                            res.status(500).send('Server error: ' + error.message);
                                        });
                                }
                            })
                            .catch(function (err) {
                                res.status(500).send('Server error: ' + err.message);
                            });
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
            })
            .catch((err) => {
                res.status(500).send('Server error: ' + err.message);
            });
    }

    // [POST] api/getUserById
    async getUserDataById(req, res, next) {
        const targetId = req.body.targetId;
        const decodedIdToken = await req.body.decodedIdToken;

        const blockList = [];
        const friendList = [];
        const reqSendList = [];
        const reqResList = [];
        const blockListRef = admin.db.collection('users').doc(decodedIdToken.user_id).collection('blockList');
        const friendListRef = admin.db.collection('users').doc(decodedIdToken.user_id).collection('friendList');
        const reqSendListRef = admin.db.collection('users').doc(decodedIdToken.user_id).collection('reqSend');
        const reqResListRef = admin.db.collection('users').doc(decodedIdToken.user_id).collection('reqRes');

        Promise.all([blockListRef.get(), friendListRef.get(), reqSendListRef.get(), reqResListRef.get()])
            .then(async (results) => {
                const blockListPromise = Promise.all(
                    results[0].docs.map((doc) => {
                        blockList.push(doc.id);
                        return doc.id;
                    }),
                );
                const friendListPromise = Promise.all(
                    results[1].docs.map((doc) => {
                        friendList.push(doc.id);
                        return doc.id;
                    }),
                );
                const reqSendListPromise = Promise.all(
                    results[2].docs.map((doc) => {
                        reqSendList.push(doc.id);
                        return doc.id;
                    }),
                );
                const reqResListPromise = Promise.all(
                    results[3].docs.map((doc) => {
                        reqResList.push(doc.id);
                        return doc.id;
                    }),
                );

                await Promise.all([blockListPromise, friendListPromise, reqSendListPromise, reqResListPromise]);

                const data = await admin.db.collection('users').doc(targetId).get();
                const responseData = data.data();
                responseData['inYourBlockList'] = blockList.includes(targetId);
                responseData['inYourFriendList'] = friendList.includes(targetId);
                responseData['inYourReqSendList'] = reqSendList.includes(targetId);
                responseData['inYourReqResList'] = reqResList.includes(targetId);
                res.status(200).send(JSON.stringify(responseData));
            })
            .catch((err) => {
                res.status(500).send('Server error: ' + err.message);
            });
    }

    // [POST] api/userInterractAction
    async userInterractAction(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const targetId = req.body.targetId;
        const action = req.body.action;
        const userDocRef = admin.db.collection('users').doc(decodedIdToken.user_id);
        const targetDocRef = admin.db.collection('users').doc(targetId);
        switch (action) {
            case 'block':
                Promise.all([
                    userDocRef.collection('blockList').doc(targetId).set({ createAt: Date.now() }),
                    targetDocRef.collection('blockByList').doc(decodedIdToken.user_id).set({ createAt: Date.now() }),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('User block successfully !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'unblock':
                Promise.all([
                    userDocRef.collection('blockList').doc(targetId).delete(),
                    targetDocRef.collection('blockByList').doc(decodedIdToken.user_id).delete(),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('User unblock successfully !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'Add friend':
                Promise.all([
                    userDocRef.collection('reqSend').doc(targetId).set({ createAt: Date.now() }),
                    targetDocRef.collection('reqRes').doc(decodedIdToken.user_id).set({ createAt: Date.now() }),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('Request successfully send !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'Unfriend':
                Promise.all([
                    userDocRef.collection('friendList').doc(targetId).delete(),
                    targetDocRef.collection('friendList').doc(decodedIdToken.user_id).delete(),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('Unfriend successfully !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'Revoke request':
                Promise.all([
                    userDocRef.collection('reqSend').doc(targetId).delete(),
                    targetDocRef.collection('reqRes').doc(decodedIdToken.user_id).delete(),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('Request successfully revoked !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'Accept request':
                const uuid = uuidv4();
                Promise.all([
                    userDocRef.collection('reqRes').doc(targetId).delete(),
                    targetDocRef.collection('reqSend').doc(decodedIdToken.user_id).delete(),
                    userDocRef.collection('friendList').doc(targetId).set({ createAt: Date.now() }),
                    targetDocRef.collection('friendList').doc(decodedIdToken.user_id).set({ createAt: Date.now() }),
                    admin.db
                        .collection('chatLists')
                        .doc(uuid)
                        .set({
                            createAt: Date.now(),
                            lastModified: Date.now(),
                            users: [decodedIdToken.user_id, targetId],
                            isSeen: [],
                        }),
                    userDocRef
                        .collection('chatList')
                        .doc(targetId)
                        .set({ createAt: Date.now(), chatRef: admin.db.collection('chatLists').doc(uuid) }),
                    targetDocRef
                        .collection('chatList')
                        .doc(decodedIdToken.user_id)
                        .set({ createAt: Date.now(), chatRef: admin.db.collection('chatLists').doc(uuid) }),
                ])
                    .then(() => {
                        const storageRef = admin.storage.bucket().file(`chatRoomStorage/${uuid}/`);
                        storageRef.createWriteStream().end();
                        res.status(200).send(JSON.stringify('The request was accepted successfully !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            case 'Reject request':
                Promise.all([
                    userDocRef.collection('reqRes').doc(targetId).delete(),
                    targetDocRef.collection('reqSend').doc(decodedIdToken.user_id).delete(),
                ])
                    .then(() => {
                        res.status(200).send(JSON.stringify('Request rejected successfully !'));
                    })
                    .catch((err) => {
                        res.status(500).send('Server error: ' + err.message);
                    });
                break;
            default:
                res.status(200).send('Action empty !');
                break;
        }
    }

    // [POST] api/notifyMarkAtRead
    async markAtRead(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const notifyId = req.body.notifyId;
        admin.db
            .collection('users')
            .doc(decodedIdToken.user_id)
            .collection('notifyList')
            .doc(notifyId)
            .update({
                isSeen: true,
            })
            .then(() => {
                res.status(200).send('');
            })
            .catch((err) => {
                res.status(500).send(err.message);
            });
    }

    // [POST] api/deleteNotify
    async deleteNotify(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const notifyId = req.body.notifyId;
        admin.db
            .collection('users')
            .doc(decodedIdToken.user_id)
            .collection('notifyList')
            .doc(notifyId)
            .delete.then(() => {
                res.status(200).send('Notify deleted');
            })
            .catch((err) => {
                res.status(500).send(err.message);
            });
    }
}

module.exports = new UserApi();
