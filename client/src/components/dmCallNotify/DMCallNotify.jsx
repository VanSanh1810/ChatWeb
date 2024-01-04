import React, { useContext, useEffect, useState } from 'react';
import './dmCallNotify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import imcomingCallSound from '../../assets/sounds/facebook-messenger-ringtone-48352.mp3';
import { useDispatch, useSelector } from 'react-redux';
import { setInCall, setInCommingDMCall } from '../../store/reducers/dmMessNotifyReducer';
import { ChatSocketContext } from '../../contexts/ChatSocketContext';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../configs/firebase';

function DMCallNotify(props) {
    const dispatch = useDispatch();

    const socketContext = useContext(ChatSocketContext);
    const { inCommingDMCall } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const { selectedChatData } = useSelector((state) => state.persistedReducer.chatReducer);
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const [uData, setUData] = useState();
    useEffect(() => {
        const notifySound = new Audio(imcomingCallSound);
        const intervalId = setInterval(() => {
            notifySound.play();
        }, 2000);
        const timeoutId = setTimeout(callTimeout, 30000);
        const userRef = doc(getFirestore(app), 'users', inCommingDMCall.callFrom);
        getDoc(userRef).then(async (doc) => {
            setUData(doc.data());
        });
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    const callTimeout = () => {
        socketContext.socket.emit(
            'reject-dm-call-room',
            inCommingDMCall.callRoom,
            inCommingDMCall.chatRoom,
            user.user_id,
            'User is busy',
        );
        dispatch(setInCommingDMCall({ chatRoom: '', callRoom: '', callFrom: '' }));
        dispatch(setInCall(false));
    };

    const acceptCall = () => {
        // URL của trang bạn muốn mở trong cửa sổ mới
        const newWindowURL = `${import.meta.env.VITE_CLIENT_URL}/dmcall/ROOM/${inCommingDMCall.callRoom}?noCam=${
            inCommingDMCall.noCam
        }&callTarget=${inCommingDMCall.callFrom}&roomTarget=${inCommingDMCall.chatRoom}`;

        // Mở cửa sổ mới
        const newWindow = window.open(newWindowURL, 'NewWindowName', 'width=1000,height=800');
        newWindow.postMessage('Hello from Parent', newWindowURL);

        // Kiểm tra xem cửa sổ có được mở thành công không
        if (newWindow) {
            dispatch(setInCall(true));
            // Cửa sổ được mở thành công, bạn có thể thực hiện các tác vụ khác tại đây
        } else {
            // Cửa sổ không được mở thành công (có thể do chặn popup bởi trình duyệt)
            alert('Không thể mở cửa sổ mới. Hãy kiểm tra cài đặt chặn popup của trình duyệt.');
        }
        dispatch(setInCommingDMCall({ chatRoom: '', callRoom: '', callFrom: '' }));
        dispatch(setInCall(true));
    };

    const rejectCall = () => {
        socketContext.socket.emit('reject-dm-call-room', inCommingDMCall.callRoom, inCommingDMCall.chatRoom, user.user_id, '');
        dispatch(setInCommingDMCall({ chatRoom: '', callRoom: '', callFrom: '' }));
        dispatch(setInCall(false));
    };

    return (
        <div className="dm_call_notify_main">
            <div className="dm_call_notify_box">
                <div className="dm_call_notify_box_header">
                    <h1>Incoming call</h1>
                    <img src={uData?.img}></img>
                    <h1>{uData?.name}</h1>
                </div>
                <div className="dm_call_notify_box_action">
                    <button onClick={acceptCall}>
                        <FontAwesomeIcon icon="fa-solid fa-check" />
                    </button>
                    <button onClick={rejectCall}>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DMCallNotify;
