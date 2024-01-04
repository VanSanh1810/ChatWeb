const admin = require('../configs/firebase/firebase.admin');

require('dotenv').config();

const users = {};
const userSocket = {};

class SocketServices {
    connection(socket) {
        socket.on('assign-user-data', (userId) => {
            console.log(userId);
            userSocket[userId] = { userId: userId, socket: socket.id };
            // console.log(userSocket[userId]);
        });
        console.log('connected' + socket.id);
        //chat messages
        socket.on('send-dm-message', async (messageObj, roomId, curentUserUid, targetUserId) => {
            if (roomId) {
                global.__io.to(roomId).emit('resive-dm-message', messageObj, roomId, curentUserUid);
                // console.log(`send-dm-message from ${roomId} by ${curentUserUid}`);
                const chatGroupRef = admin.db.collection('chatLists').doc(roomId);
                const data = await chatGroupRef.get();
                const users = await data.data().users;
                if (users.includes(curentUserUid)) {
                    chatGroupRef
                        .collection('messages')
                        .doc(messageObj.id)
                        .set({
                            message: messageObj.messData,
                            mediaData: messageObj.mediaData,
                            sendAt: messageObj.sendAt,
                            sendBy: curentUserUid,
                            type: messageObj.type ? messageObj.type : null,
                            isSeen: false,
                        });
                    chatGroupRef.update({
                        isSeen: [curentUserUid],
                        lastModified: Date.now(),
                    });
                    if (messageObj.mediaData) {
                        messageObj.mediaData.forEach((item) => {
                            chatGroupRef.collection('media').add({
                                media: item,
                                sendAt: Date.now(),
                            });
                        });
                    }
                }
            }
        });

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log('joined:' + roomId);
        });

        //chat call
        socket.on('request-dm-call-room', async ({ callRoom, chatRoom, userCalling, noCam }) => {
            //calling user
            global.__io.to(chatRoom).emit('resive-dm-call-room', callRoom, chatRoom, userCalling, noCam);
        });

        socket.on('reject-dm-call-room', async (callRoom, chatRoom, userCalling, message) => {
            console.log('reject-dm-call-room', callRoom, chatRoom, userCalling, message);
            const _message = message ? message : 'User reject the call';
            global.__io.to(callRoom).emit('rejected-dm-call-room', callRoom, chatRoom, userCalling, message);
            global.__io.to(chatRoom).emit('rejected-dm-call-room', callRoom, chatRoom, userCalling, message);
        });

        socket.on('join-dm-call-room', async (callRoomId, chatRoomId, userId, peerID) => {
            socket.join(callRoomId);
            global.__io.to(callRoomId).emit('user-joined-dm-call-room', callRoomId, chatRoomId, userId, peerID);
            global.__io.to(chatRoomId).emit('user-joined-dm-call-room', callRoomId, chatRoomId, userId, peerID);
        });

        socket.on('in-another-dm-call-room', async (callRoomId, chatRoomId, userId) => {
            const message = 'User is in another call';
            global.__io.to(callRoomId).emit('rejected-dm-call-room', callRoomId, chatRoomId, userId, message);
            global.__io.to(chatRoomId).emit('rejected-dm-call-room', callRoomId, chatRoomId, userId, message);
        });

        socket.on('leave-dm-call-room', async (callRoomId, chatRoomId, userLeave) => {
            // on user leave call room
            global.__io.to(callRoomId).emit('user-leave-dm-call-room', callRoomId, chatRoomId, userLeave);
            global.__io.to(chatRoomId).emit('user-leave-dm-call-room', callRoomId, chatRoomId, userLeave);
            socket.leave(callRoomId);
        });

        // server messages
        socket.on('join-server', (roomId) => {
            socket.join(roomId);
            console.log('joined server:' + roomId);
        });

        socket.on('join-server-room', (roomId) => {
            socket.join(roomId);
            console.log('joined server room:' + roomId);
        });

        socket.on('send-message', async (messageObj, roomId, channelId, serverId, curentUserUid) => {
            // console.log('send message', messageObj, roomId, channelId);
            if (roomId) {
                global.__io.to(roomId).emit('resive-message', messageObj, roomId, channelId, serverId, curentUserUid);
                const roomRef = admin.db
                    .collection('servers')
                    .doc(serverId)
                    .collection('chanels')
                    .doc(channelId)
                    .collection('rooms')
                    .doc(roomId);
                roomRef.collection('messages').doc(messageObj.id).set({
                    message: messageObj.messData,
                    mediaData: messageObj.mediaData,
                    sendAt: messageObj.sendAt,
                    isImg: messageObj.isImg,
                    sendBy: curentUserUid,
                });
                roomRef.update({
                    isSeen: [curentUserUid],
                    lastModified: Date.now(),
                });
            }
        });

        //server call room

        socket.on('user-join-server-call', (userId, roomId) => {
            if (users[roomId]) {
                users[roomId].push({ socketId: socket.id, userId: userId });
            } else {
                users[roomId] = [{ socketId: socket.id, userId: userId }];
            }
            const usersInThisRoom = users[roomId].filter((item) => item.userId !== userId);

            socket.emit('users-in-server-call', usersInThisRoom);
        });

        socket.on('user-sendSignal-server-call', (payload) => {
            global.__io.to(payload.userToSignal).emit('user-joined-server-call', {
                signal: payload.signal,
                callerId: payload.callerId,
                callerSocketId: payload.callerSocketId,
            });
        });

        socket.on('user-returningSignal-server-call', (payload) => {
            global.__io.to(payload.callerSocketId).emit('resiving-returning-signal', {
                signal: payload.signal,
                callerSocketId: socket.id,
                callerId: payload.callerId,
            });
        });

        socket.on('user-leave-server-call', (userId, roomId) => {
            let room = users[roomId];
            if (room) {
                room = room.filter((u) => u.userId !== userId);
                users[roomId] = room;
                global.__io.to(roomId).emit('user-left-server-call', { userId: userId, socketId: socket.id });
            }
        });

        socket.on('disconnect', () => {
            console.log('disconnect');
        });
    }
}

module.exports = new SocketServices();
