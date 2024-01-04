import React, { Component, useContext, useEffect, useState } from 'react';
import './nav.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import app from '../../configs/firebase';
import { getAuth } from 'firebase/auth';
import axiosInstance from '../../configs/axiosConfig';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/reducers/authReducer';
import { pages } from '../../store/reducers/pageReducer';
import { clearToastState } from '../../store/reducers/toastReducer';
import { clearSelectedChatData } from '../../store/reducers/chatReducer';
import { setRoomSelect, setServerSelect } from '../../store/reducers/serverReducer';
import { ChatSocketContext } from '../../contexts/ChatSocketContext';
import { QuerySnapshot, collection, getFirestore, onSnapshot } from 'firebase/firestore';

function Nav(props) {
    const dispatch = useDispatch();
    const { userToken, user } = useSelector((state) => state.persistedReducer.authReducer);
    const { pageToken } = useSelector((state) => state.persistedReducer.pageReducer);
    const { serverSelect, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { dmNotifyArray } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const socketContext = useContext(ChatSocketContext);
    ////////////////////////////////////////////////////////////////
    const [isHaveNewDMMessage, setIsHaveNewDMMessage] = useState(false);
    const [isHaveNewNotify, setIsHaveNewNotify] = useState(false);
    const [isHaveNewRequest, setIsHaveNewRequest] = useState(false);

    const handleClickLogout = () => {
        dispatch(clearToastState());
        dispatch(clearSelectedChatData());
        dispatch(logout('userToken'));
        dispatch(setServerSelect(null));
        dispatch(setRoomSelect({ channelId: '', roomId: '', roomType: '' }));
        socketContext.endCall();
        getAuth(app).signOut();
    };

    // const handleClickTest = () => {
    //     const fetchToken = async (IdToken) => {
    //         try {
    //             console.log(IdToken);
    //             const { data } = await axiosInstance.post('/test/test', { idToken: IdToken });
    //             console.log(data);
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     };
    //     fetchToken(userToken);
    // };

    const navNavigation = (pageNum) => {
        props.setPagess(pageNum);
    };
    useEffect(() => {
        const isHaveNewDMMessage = async (dmNotifyArray) => {
            // console.log(dmNotifyArray);
            let isHaveNew = false;
            Promise.all(
                dmNotifyArray.map(async (item, index) => {
                    if (item.value > 0) {
                        isHaveNew = true;
                    }
                    return index;
                }),
            ).then(() => {
                setIsHaveNewDMMessage(isHaveNew);
            });
        };
        isHaveNewDMMessage(dmNotifyArray);
    }, [dmNotifyArray]);

    useEffect(() => {
        const notifyColRef = collection(getFirestore(app), 'users', user.user_id, 'notifyList');
        const unSub = onSnapshot(notifyColRef, async (querySnapshot) => {
            setIsHaveNewNotify(!querySnapshot.empty);
        });
        return unSub();
    }, [user.user_id]);

    useEffect(() => {
        const reqColRef = collection(getFirestore(app), 'users', user.user_id, 'reqRes');
        const unSub = onSnapshot(reqColRef, async (querySnapshot) => {
            setIsHaveNewRequest(!querySnapshot.empty);
        });
        return unSub();
    }, [user.user_id]);

    // useEffect(() => {
    //     const previousListJSON = JSON.stringify(dmNotifyArray);

    //     return () => {
    //       const currentListJSON = JSON.stringify(dmNotifyArray);

    //       if (previousListJSON !== currentListJSON) {
    //         console.log('Effect triggered due to a change in yourList');
    //       }
    //     };
    //   }, [dmNotifyArray]);

    return (
        <div className="navbar">
            <div className="nav__block">
                <div
                    className="nav__block_main_feature"
                    onClick={() => {
                        navNavigation(pages.main);
                    }}
                >
                    <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                    {isHaveNewDMMessage ? <span className="have_new_mess"></span> : null}
                </div>
                <div
                    className="nav__block_main_feature"
                    onClick={() => {
                        navNavigation(pages.server);
                    }}
                >
                    <FontAwesomeIcon icon="fa-solid fa-server" />
                    {/* <span className="have_new_mess"></span> */}
                </div>
            </div>
            <div className="nav__block">
                {/* <div className={pageToken === pages.main ? 'nav selected' : 'nav'}>
                    <i className="fa-solid fa-user-group" onClick={handleClickTest}>
                        <FontAwesomeIcon icon="fa-solid fa-code" />
                    </i>
                </div> */}
                {/* <div className={pageToken === pages.games ? 'nav selected' : 'nav'}>
                    <i
                        className="fa-solid fa-user-group"
                        onClick={() => {
                            navNavigation(pages.games);
                        }}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-chess-board" />
                    </i>
                </div> */}
                <div className={pageToken === pages.search ? 'nav selected' : 'nav'}>
                    <i
                        className="fa-solid fa-user-group"
                        onClick={() => {
                            navNavigation(pages.search);
                        }}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                    </i>
                </div>
                <div className={pageToken === pages.notify ? 'nav selected' : 'nav'}>
                    <i
                        className="fa-solid fa-user-group"
                        onClick={() => {
                            navNavigation(pages.notify);
                        }}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-bell" />
                        {isHaveNewNotify ? <span className="have_new_notify"></span> : null}
                    </i>
                </div>
                <div className={pageToken === pages.profile ? 'nav selected' : 'nav'}>
                    <i
                        className="fa-solid fa-user"
                        onClick={() => {
                            navNavigation(pages.profile);
                        }}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-user" />
                        {isHaveNewRequest ? <span className="have_new_notify"></span> : null}
                    </i>
                </div>
                <div className="nav">
                    <i className="fa-solid fa-arrow-right-from-bracket" onClick={handleClickLogout}>
                        <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" />
                    </i>
                </div>
            </div>
        </div>
    );
}

export default Nav;
