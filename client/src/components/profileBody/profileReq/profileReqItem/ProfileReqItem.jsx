import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getFirestore, onSnapshot, doc } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import './profileReqItem.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ProfileReqItem(props) {
    const dispatch = useDispatch();

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [userData, setUserData] = useState({});
    const [yBtn, setYBtn] = useState(false);
    const [xBtn, setXBtn] = useState(false);
    useEffect(() => {
        switch (props.category) {
            case 'reqRes':
                setYBtn(true);
                setXBtn(true);
                break;
            case 'reqSend':
                setYBtn(false);
                setXBtn(true);
                break;
            case 'blockList':
                setYBtn(false);
                setXBtn(true);
                break;
            case 'friendList':
                setYBtn(false);
                setXBtn(true);
                break;
        }
        const docRef = doc(getFirestore(app), 'users', props.uid);
        const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
            setUserData(querySnapshot.data());
        });
        // Clean-up function để huỷ đăng ký lắng nghe khi component bị unmount
        return () => {
            unsubscribe();
        };
    }, [props.uid, props.category]);

    const onYClick = () => {
        const click = async () => {
            try {
                await axiosInstance
                    .post('/api/userInterractAction', {
                        idToken: userToken,
                        targetId: props.uid,
                        action: 'Accept request',
                    })
                    .then(() => {
                        dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Request accepted !' }));
                        props.onDeleteComponent(props.uid);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        };
        click();
    };

    const onXClick = () => {
        let action = '';
        let toastMess = '';
        switch (props.category) {
            case 'reqRes':
                action = 'Reject request';
                toastMess = 'Request rejected !';
                break;
            case 'reqSend':
                action = 'Revoke request';
                toastMess = 'The request has been removed !';
                break;
            case 'blockList':
                action = 'unblock';
                toastMess = 'Unblocked successfully !';
                break;
            case 'friendList':
                action = 'Unfriend';
                toastMess = 'Unfriended successfully !';
                break;
        }
        const click = async (action) => {
            try {
                const { data } = await axiosInstance
                    .post('/api/userInterractAction', {
                        idToken: userToken,
                        targetId: props.uid,
                        action: action,
                    })
                    .then(() => {
                        dispatch(setToastState({ Tstate: toastType.success, Tmessage: toastMess }));
                        props.onDeleteComponent(props.uid);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } catch (error) {
                console.log(error);
            }
        };
        click(action);
    };

    return (
        <>
            <div className="profileReq_item">
                <img src={userData.img} />
                <span>{userData.name}</span>
                <div className="req_action_btn_container">
                    {yBtn ? (
                        <button className="green" onClick={onYClick}>
                            <FontAwesomeIcon icon="fa-solid fa-check" />
                        </button>
                    ) : null}
                    {xBtn ? (
                        <button className="red" onClick={onXClick}>
                            <FontAwesomeIcon icon="fa-solid fa-xmark" />
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    );
}

export default ProfileReqItem;
