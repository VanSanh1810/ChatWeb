import { collection, doc, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import { createContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import app from '../configs/firebase';
import { setDmNotifyArray } from '../store/reducers/dmMessNotifyReducer';

const SocketIOContext = createContext();

function SocketIOProvider({ children }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const socket = io(import.meta.env.VITE_BASE_URL);
    useEffect(() => {
        socket.once('connect', () => {
            socket.emit('assign-user-data', user.user_id);
        });
        return () => {
            socket.disconnect();
        };
    }, [socket, user]);

    useEffect(() => {
        /// all list chat
        const userDocRef = doc(getFirestore(app), 'users', user.user_id);
        const unSub = onSnapshot(collection(userDocRef, 'chatList'), (docs) => {
            let listNotify = [];
            Promise.all(
                docs.docs.map(async (doc) => {
                    socket.emit('join-room', await doc.data().chatRef.id);
                    const tempData2 = {
                        key: doc.id,
                        value: 0,
                    };
                    listNotify.push(tempData2);
                }),
            ).then(() => {
                dispatch(setDmNotifyArray(listNotify));
            });
        });
        getDocs(collection(userDocRef, 'servers')).then((docs) => {
            docs.docs.map(async (doc) => {
                socket.emit('join-server', doc.id);
                getDocs(collection(getFirestore(app), 'servers', doc.id, 'chanels')).then((channels) => {
                    channels.docs.map(async (channel) => {
                        getDocs(collection(getFirestore(app), 'servers', doc.id, 'chanels', channel.id, 'rooms')).then(
                            (rooms) => {
                                rooms.docs.map(async (room) => {
                                    socket.emit('join-server-room', room.id);
                                });
                            },
                        );
                    });
                });
            });
        });
        return () => {
            unSub();
        };
    }, [socket, user]);
    return <SocketIOContext.Provider value={{ socket }}>{children}</SocketIOContext.Provider>;
}

export { SocketIOContext, SocketIOProvider };
