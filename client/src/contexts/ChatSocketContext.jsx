import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setInCall, setInCommingDMCall } from '../store/reducers/dmMessNotifyReducer';
import Peer from 'simple-peer';
import { SocketIOContext } from './SocketIOContext';
import { setDmNotifyArray } from '../store/reducers/dmMessNotifyReducer';
import messageSound from '../assets/sounds/message.mp3';
import { setRoomSelect } from '../store/reducers/serverReducer';

const ChatSocketContext = createContext();

function ChatSocketProvider({ children }) {
    const socketIOContext = useContext(SocketIOContext);
    const dispatch = useDispatch();

    const { dmNotifyArray } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { selectedChatData } = useSelector((state) => state.persistedReducer.chatReducer);
    const [inMediaCall, setInMediaCall] = useState(false);

    ////////////////////////////////////////////////////////////////
    const [seletedServerCallRoom, setSeletedServerCallRoom] = useState();
    const [isShareScreen, setIsShareScreen] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [peers, setPeers] = useState([]);
    const [myStream, setMyStream] = useState();
    const [myScreenStream, setMyScreenStream] = useState();
    const peersRef = useRef([]);

    const endCall = useCallback(() => {
        if (myStream) {
            myStream.getTracks().forEach((track) => {
                track.stop();
            });
            setMyStream(null);
            Promise.all(
                peers.map((peer) => {
                    peer.destroy();
                }),
            ).then(() => {
                setSeletedServerCallRoom(null);
                peersRef.current = [];
                setPeers([]);
                // socketIOContext.socket.off('users-in-server-call');
                // socketIOContext.socket.off('user-joined-server-call');
                // socketIOContext.socket.off('resiving-returning-signal');
                // socketIOContext.socket.off('user-left-server-call');
            });
            socketIOContext.socket.emit('user-leave-server-call', user.user_id, seletedServerCallRoom);
            dispatch(setRoomSelect({ channelId: '', roomId: '', roomType: '' }));
        }
    }, [myStream, peers, seletedServerCallRoom, socketIOContext.socket, user.user_id]);

    const createPeer = useCallback(
        (userToSignal, callerId, callerSocketId, stream) => {
            //new join
            const peer = new Peer({
                initiator: true,
                trickle: false,
                stream: stream,
            });

            peer.on('signal', (signal) => {
                socketIOContext.socket.emit('user-sendSignal-server-call', {
                    userToSignal: userToSignal,
                    callerId: callerId,
                    callerSocketId: callerSocketId,
                    signal: signal,
                });
            });
            return peer;
        },
        [socketIOContext.socket],
    );

    const addPeer = useCallback(
        (incomingSignal, callerId, callerSocketId, stream) => {
            // old join
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: stream,
            });

            peer.on('signal', (signal) => {
                socketIOContext.socket.emit('user-returningSignal-server-call', {
                    signal: signal,
                    callerId: callerId,
                    callerSocketId: callerSocketId,
                });
            });
            peer.signal(incomingSignal);
            return peer;
        },
        [socketIOContext.socket],
    );
    // function createPeer(userToSignal, callerId, callerSocketId, stream) {
    //     //new join
    //     const peer = new Peer({
    //         initiator: true,
    //         trickle: false,
    //         stream: stream,
    //     });

    //     peer.on('signal', (signal) => {
    //         socketIOContext.socket.emit('user-sendSignal-server-call', {
    //             userToSignal: userToSignal,
    //             callerId: callerId,
    //             callerSocketId: callerSocketId,
    //             signal: signal,
    //         });
    //     });
    //     return peer;
    // }

    // function addPeer(incomingSignal, callerId, callerSocketId, stream) {
    //     // old join
    //     const peer = new Peer({
    //         initiator: false,
    //         trickle: false,
    //         stream: stream,
    //     });

    //     peer.on('signal', (signal) => {
    //         socketIOContext.socket.emit('user-returningSignal-server-call', {
    //             signal: signal,
    //             callerId: callerId,
    //             callerSocketId: callerSocketId,
    //         });
    //     });
    //     peer.signal(incomingSignal);
    //     return peer;
    // }

    useEffect(() => {
        socketIOContext.socket.on('dm-notification', (data) => {});

        socketIOContext.socket.on('resive-dm-message', async (message, roomId, curentUserUid) => {
            if (roomId !== selectedChatData.chatId) {
                //Receive message when not in chat
                //for notify stack
                let tempList = [...dmNotifyArray];
                console.log(tempList);
                const newArrayKeyValue = await Promise.all(
                    tempList.map(async (item) => {
                        if (item.key === curentUserUid) {
                            return { key: curentUserUid, value: item.value + 1 };
                        }
                        return item;
                    }),
                );

                dispatch(setDmNotifyArray(newArrayKeyValue));
                const notifySound = new Audio(messageSound);
                notifySound.play();
            }
        });
        ///
        socketIOContext.socket.on('resive-dm-call-room', async (callRoomId, chatRoomId, userCalling, noCam) => {
            if (userCalling !== user.user_id) {
                if (!inMediaCall) {
                    // available for call
                    dispatch(
                        setInCommingDMCall({ chatRoom: chatRoomId, callRoom: callRoomId, callFrom: userCalling, noCam: noCam }),
                    );
                    dispatch(setInCall(true));
                    setInMediaCall(true);
                } else {
                    // user are in another call room
                    socketIOContext.socket.emit('in-another-dm-call-room', callRoomId, selectedChatData.chatId, user.user_id);
                }
            }
        });
        socketIOContext.socket.on('user-leave-dm-call-room', async (callRoomId, chatRoomId, userLeave) => {
            if (userLeave === user.user_id) {
                dispatch(setInCall(false));
                setInMediaCall(false);
            }
        });
        ///

        ///
        // socket.on('connect', () => {
        //     socket.emit('userOnline', { userId: user.user_id });
        // });
        // socket.on('disconnect', () => {
        //     socket.emit('userOffline', { userId: user.user_id });
        // });

        return () => {
            socketIOContext.socket.off('connect');
            socketIOContext.socket.off('dm-notification');
            socketIOContext.socket.off('resive-dm-message');
            socketIOContext.socket.off('resive-dm-call-room');
            socketIOContext.socket.off('user-leave-dm-call-room');
        };
    }, [user.user_id, socketIOContext.socket, dispatch, dmNotifyArray, inMediaCall, selectedChatData]); //dont change this dependency array, this will remove the send-dm-message in ChatContent.jsx

    useEffect(() => {
        socketIOContext.socket.on('users-in-server-call', (users) => {
            console.log(users);
            const peers = [];
            users.forEach((u) => {
                const peer = createPeer(u.socketId, user.user_id, socketIOContext.socket.id, myStream);
                peersRef.current.push({
                    peerId: { socketId: u.socketId, userId: u.userId },
                    peer: peer,
                });
                peers.push(peer);
            });
            setPeers(peers);
        });
        socketIOContext.socket.on('user-joined-server-call', (payload) => {
            const peer = addPeer(payload.signal, payload.callerId, payload.callerSocketId, myStream);
            peersRef.current.push({
                peerId: { socketId: payload.callerSocketId, userId: payload.callerId },
                peer: peer,
            });
            setPeers((users) => [...users, peer]);
        });
        socketIOContext.socket.on('resiving-returning-signal', (payload) => {
            const item = peersRef.current.find((p) => p.peerId.socketId === payload.callerSocketId);
            if (item) {
                console.log('item found');
                item.peer.signal(payload.signal);
            } else {
                console.log('item not found');
            }
        });
        socketIOContext.socket.on('user-left-server-call', (payload) => {
            if (payload.userId !== user.user_id) {
                const item = peersRef.current.find((p) => p.peerId.userId === payload.userId);
                item.peer.destroy();
                setPeers((peerList) => peerList.filter((p) => p !== item.peer));
                const newPeerArr = peersRef.current.filter((p) => p.peerId.userId !== payload.userId);
                peersRef.current = newPeerArr;
            }
        });
        return () => {
            socketIOContext.socket.off('users-in-server-call');
            socketIOContext.socket.off('user-joined-server-call');
            socketIOContext.socket.off('resiving-returning-signal');
            socketIOContext.socket.off('user-left-server-call');
        };
    }, [socketIOContext.socket, myStream, user.user_id, addPeer, createPeer]);

    function startScreenShare() {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
            setMyScreenStream(stream);
            let screenVideoTrack = stream.getVideoTracks()[0];
            let videoTrack = myStream.getVideoTracks()[0];
            screenVideoTrack.onended = () => {
                stopScreenSharing();
            };
            Promise.all(
                peers.map(async (peer, index) => {
                    await peer.replaceTrack(videoTrack, screenVideoTrack, myStream);
                    return index;
                }),
            ).then(() => {
                setIsShareScreen(true);
            });
        });
    }

    function stopScreenSharing() {
        let videoTrack = myStream.getVideoTracks()[0];
        let screenVideoTrack = myScreenStream.getVideoTracks()[0];
        Promise.all(
            peers.map(async (peer, index) => {
                await peer.replaceTrack(screenVideoTrack, videoTrack, myStream);
                return index;
            }),
        ).then(() => {
            myScreenStream.getTracks().forEach(function (track) {
                track.stop();
            });
            setMyScreenStream(null);
            setIsShareScreen(false);
        });
    }

    return (
        <ChatSocketContext.Provider
            value={{
                socket: socketIOContext.socket,
                inMediaCall,
                peers,
                myStream,
                setMyStream,
                myScreenStream,
                setMyScreenStream,
                seletedServerCallRoom,
                setSeletedServerCallRoom,
                endCall,
                isShareScreen,
                setIsShareScreen,
                isMicOn,
                setIsMicOn,
                isVideoOn,
                setIsVideoOn,
                peersRef,
                startScreenShare,
                stopScreenSharing,
            }}
        >
            {children}
        </ChatSocketContext.Provider>
    );
}

export { ChatSocketContext, ChatSocketProvider };
