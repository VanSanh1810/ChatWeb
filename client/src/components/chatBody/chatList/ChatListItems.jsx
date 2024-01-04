import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { doc, getFirestore, getDoc, collection, getDocs, where, query, onSnapshot } from 'firebase/firestore';
import { setSelectedChatData } from '../../../store/reducers/chatReducer';
import Avatar from './Avatar';
import app from '../../../configs/firebase';
import { setDmNotifyArray } from '../../../store/reducers/dmMessNotifyReducer';
import axiosInstance from '../../../configs/axiosConfig';

function ChatListItems(props) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { dmNotifyArray } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const [notSeenMessArr, setNotSeenMessArr] = useState(0);
    const [totalNotSeen, setTotalNotSeen] = useState(0);
    const [uData, setUData] = useState({});

    const [lastMessSendTime, setLastMessSendTime] = useState();

    const [inSearch, setInSearch] = useState(true);

    const selectChat = async (e) => {
        if (!e.currentTarget.classList.contains('active')) {
            dispatch(setSelectedChatData({ chatId: props.chatRef.id, userChatId: props._id }));
            setTotalNotSeen(0);
            setNotSeenMessArr(0);
            axiosInstance.put(
                '/api/chat/confirmSeenDM',
                { idToken: userToken, chatId: props.chatRef.id },
                {
                    withCredentials: true,
                },
            );
            let tempList = [...dmNotifyArray];
            const newArrayKeyValue = await Promise.all(
                tempList.map((item) => {
                    if (item.key === props._id) {
                        return { key: props._id, value: 0 };
                    }
                    return item;
                }),
            );
            dispatch(setDmNotifyArray(newArrayKeyValue));
        }
        for (let index = 0; index < e.currentTarget.parentNode.children.length; index++) {
            e.currentTarget.parentNode.children[index].classList.remove('active');
        }
        e.currentTarget.classList.add('active');
    };
    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', props._id);
        getDoc(userDocRef).then((doc) => {
            if (doc.exists()) {
                let name = doc.data().name.trim().toLowerCase();
                let searchData = props?.searchData.trim().toLowerCase();
                if (searchData) {
                    if (searchData === '') {
                        setUData({
                            img: doc.data().img,
                            name: doc.data().name,
                        });
                        setInSearch(true);
                    } else {
                        if (name.includes(searchData)) {
                            setUData({
                                img: doc.data().img,
                                name: doc.data().name,
                            });
                            setInSearch(true);
                        } else {
                            setInSearch(false);
                        }
                    }
                } else {
                    setUData({
                        img: doc.data().img,
                        name: doc.data().name,
                    });
                    setInSearch(true);
                }
            }
        });
        const getMessNotSeen = () => {
            const chatDocRef = doc(getFirestore(app), 'chatLists', props.chatRef.id);
            getDoc(chatDocRef).then(async (doc) => {
                if (doc.exists() && !doc.data().isSeen.includes(user.user_id)) {
                    const chatMessRef = query(
                        collection(getFirestore(app), 'chatLists', props.chatRef.id, 'messages'),
                        where('isSeen', '==', false),
                        where('sendBy', '!=', user.user_id),
                    );
                    await getDocs(chatMessRef).then((docs) => {
                        setNotSeenMessArr(docs.docs.length);
                    });
                }
            });
        };
        getMessNotSeen();
    }, [props._id, props.chatRef.id, props.searchData, user.user_id]);

    useEffect(() => {
        const unsub = onSnapshot(doc(getFirestore(app), 'chatLists', props.chatRef.id), (doc) => {
            setLastMessSendTime(doc.data().lastModified);
        });
        return () => {
            unsub();
        };
    }, [props.chatRef.id]);

    const calculateTimeDifference = (referenceTimestamp) => {
        // Lấy thời điểm hiện tại
        const currentTime = new Date().getTime();

        // Chênh lệch thời gian giữa thời điểm hiện tại và thời điểm mốc
        const timeDiff = currentTime - referenceTimestamp;

        // Chuyển đổi thời gian chênh lệch thành phút
        const minutesDiff = Math.floor(timeDiff / (60 * 1000));

        if (minutesDiff < 60) {
            return `${minutesDiff} minutes ago`;
        } else if (minutesDiff < 24 * 60) {
            const hoursDiff = Math.floor(minutesDiff / 60);
            return `${hoursDiff} hours ago`;
        } else {
            // Format lại thời gian mốc thành ngày/giờ/phút
            const referenceDate = new Date(referenceTimestamp);
            const formattedDate = referenceDate.toLocaleString();

            return `${formattedDate}`;
        }
    };

    useEffect(() => {
        const total = notSeenMessArr + dmNotifyArray.find((item) => item.key === props._id).value;
        setTotalNotSeen(total);
    }, [dmNotifyArray, notSeenMessArr, props._id]);

    return (
        <div
            style={{ animationDelay: `0.${props.animationDelay}s`, display: `${inSearch ? 'flex' : 'none'}` }}
            onClick={selectChat}
            className={`chatlist__item ${props.active ? props.active : ''} `}
        >
            <Avatar image={uData.img ? uData.img : 'https://place-hold.it/80x80'} isOnline={props.isOnline} />

            <div className="userMeta">
                <p>{uData.name}</p>
                <span className="activeTime">{calculateTimeDifference(lastMessSendTime)}</span>
            </div>
            {totalNotSeen !== 0 ? (
                <div className="listchat_badge_container">
                    <div className="listchat_badge">
                        <h5>{totalNotSeen <= 9 ? totalNotSeen : '9+'}</h5>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default ChatListItems;
