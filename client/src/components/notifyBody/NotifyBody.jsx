import React, { useEffect, useState } from 'react';
import './notifyBody.css';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../configs/axiosConfig';
import { setToastState, toastType } from '../../store/reducers/toastReducer';

function NotifyBody() {
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const navValue = {
        all: 0,
        unread: 1,
    };
    const [notifyNav, setNotifyNav] = useState(0);
    const [notifyList, setNotifyList] = useState([]);

    useEffect(() => {
        const notifyColRef = collection(getFirestore(app), 'users', user.user_id, 'notifyList');
        console.log(1111);
        const unSub = onSnapshot(notifyColRef, (data) => {
            let tempList = [];
            Promise.all(
                data.docs.map(async (doc) => {
                    tempList.push({ id: doc.id, data: doc.data() });
                }),
            ).then(() => {
                setNotifyList([...tempList]);
            });
        });
        return () => {
            unSub();
        };
    }, [user.user_id, notifyNav]);

    return (
        <div className="main__chatbody notifyMain">
            <h3>Notify</h3>
            <div className="notify_nav">
                <button className={notifyNav === navValue.all ? 'selected' : ''} onClick={() => setNotifyNav(navValue.all)}>
                    All
                </button>
                <button className={notifyNav === navValue.unread ? 'selected' : ''} onClick={() => setNotifyNav(navValue.unread)}>
                    Unread
                </button>
            </div>
            <div className="notify_container">
                {notifyList.length === 0 ? <h5>No data</h5> : null}
                {notifyList.map((notify, index) => {
                    if (notify.data.isSeen === true || notifyNav === navValue.all) {
                        return <NotifyItem key={notify.id} notifyData={notify} />;
                    }
                })}
            </div>
        </div>
    );
}

export default NotifyBody;

function NotifyItem(props) {
    const dispatch = useDispatch();
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [notifyData, setNotifyData] = useState();
    const [notifyID, setNotifyID] = useState();
    const [btnActionList, setBtnActionList] = useState([]);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        setNotifyID(props.notifyData.id);
        setNotifyData(props.notifyData.data);
        setBtnActionList([...props.notifyData.data.actionButton]);
    }, [props.notifyData]);

    const calculateTimeDifference = (referenceTimestamp) => {
        // Lấy thời điểm hiện tại
        const currentTime = new Date().getTime();

        // Chênh lệch thời gian giữa thời điểm hiện tại và thời điểm mốc
        const timeDiff = currentTime - referenceTimestamp;

        // Chuyển đổi thời gian chênh lệch thành phút
        const minutesDiff = Math.floor(timeDiff / (60 * 1000));

        if (minutesDiff <= 5) {
            return `Just now`;
        } else if (minutesDiff < 60) {
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

    const actionButton = (endpoint, payload) => {
        axiosInstance
            .post(endpoint, {
                idToken: userToken,
                payload: payload,
                notifyId: notifyID,
            })
            .then((response) => {
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: response.data }));
                setMenuVisible(false);
            });
    };

    const markAsRead = () => {
        axiosInstance
            .post('/api/notifyMarkAtRead', {
                idToken: userToken,
                notifyId: notifyID,
            })
            .then((response) => {
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: response.data }));
                setMenuVisible(false);
            });
    };

    const deleteNotify = () => {
        axiosInstance
            .post('/api/deleteNotify', {
                idToken: userToken,
                notifyId: notifyID,
            })
            .then((response) => {
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: response.data }));
                setMenuVisible(false);
            });
    };

    return (
        <div className={props.notifyData.data.isSeen ? 'main__notify_item read' : 'main__notify_item'}>
            <img src={notifyData?.img} />
            <div className="notify_item_content">
                <p>{notifyData?.title + '- ' + notifyData?.describe}</p>
                <p>{calculateTimeDifference(props.notifyData.data.createAt)}</p>
            </div>
            <div className="notify_item_action">
                {btnActionList?.map((btn, index) => {
                    return (
                        <button
                            key={index}
                            style={{ backgroundColor: btn.color }}
                            className="btn_success"
                            onClick={() => actionButton(btn.endpoint, btn.payload)}
                        >
                            {btn.btnName}
                        </button>
                    );
                })}
            </div>
            <div
                className="notify_item_setting"
                onMouseLeave={() => setMenuVisible(false)}
                onMouseOver={() => setMenuVisible(true)}
            >
                <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
                {menuVisible ? (
                    <div
                        className="roomm_context_container"
                        style={{
                            position: 'absolute',
                            background: 'white',
                            padding: '5px',
                            transform: 'translate(-100px, 0px)',
                        }}
                    >
                        <button onClick={markAsRead}>Mark at read</button>
                        <button onClick={deleteNotify}>Delete</button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
