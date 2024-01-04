import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './chatList.css';
import ChatListItems from './ChatListItems';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { onSnapshot, doc, collection, getFirestore } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { setDmNotifyArray } from '../../../store/reducers/dmMessNotifyReducer';
import { setSelectedChatData } from '../../../store/reducers/chatReducer';
import { setInCall, setInCommingDMCall } from '../../../store/reducers/dmMessNotifyReducer';

function ChatList(props) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const { selectedChatData } = useSelector((state) => state.persistedReducer.chatReducer);
    const { inCall } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);

    const [chatSearch, setChatSearch] = useState('');

    const [allChatUsers, setAllChatUsers] = useState([
        // {
        //     image: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        //     id: 7,
        //     name: 'Hasan Mcculloch',
        //     active: false,
        //     isOnline: true,
        // },
    ]);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', user.user_id);
        const unsubscribe = onSnapshot(collection(userDocRef, 'chatList'), async (querySnapshot) => {
            const listChat = [];
            await Promise.all(
                querySnapshot.docs.map((doc, index) => {
                    const tempData = {
                        id: doc.id,
                        chatRef: doc.data().chatRef,
                        active: selectedChatData.userChatId === doc.id ? true : false,
                        isOnline: true,
                    };
                    listChat.push(tempData);
                    return index;
                }),
            );
            setAllChatUsers(listChat);
        });
        return () => {
            unsubscribe();
        };
    }, [user, selectedChatData]);

    const searchChat = (e) => {
        // console.log(e.target.value);
        setChatSearch(e.target.value);
    };

    return (
        <div className="main__chatlist">
            <div className="chatlist__heading">
                <h2>Direct Message</h2>
                <button className="btn-nobg">
                    <i className="fa fa-ellipsis-h">
                        <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
                    </i>
                </button>
            </div>
            <div className="chatList__search">
                <div className="search_wrap">
                    <input name="chatList_search_input" type="text" placeholder="Search here" onChange={searchChat} />
                    <button className="search-btn">
                        <i className="fa fa-search">
                            <FontAwesomeIcon icon="fa-solid fa-search" />
                        </i>
                    </button>
                </div>
            </div>
            <div className="chatlist__items">
                {allChatUsers.map((item, index) => {
                    return (
                        <ChatListItems
                            searchData={chatSearch}
                            key={item.id}
                            _id={item.id}
                            animationDelay={index + 1}
                            active={item.active ? 'active' : ''}
                            isOnline={item.isOnline ? 'active' : ''}
                            chatRef={item.chatRef}
                        />
                    );
                })}
                {allChatUsers.length ? null : <h1 className="chatlist__noItem">No item</h1>}
            </div>
        </div>
    );
}

export default ChatList;
