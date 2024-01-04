import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './profileReq.css';
import ProfileReqItem from './profileReqItem/ProfileReqItem';
import { getFirestore, onSnapshot, doc, collection } from 'firebase/firestore';
import app from '../../../configs/firebase';
import Loader from '../../loader/Loader';
import { clearToastState, toastType } from '../../../store/reducers/toastReducer';

function ProfileReq() {
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const reqNum = {
        reqRes: 'reqRes',
        reqSend: 'reqSend',
        Friends: 'friendList',
        BlockList: 'blockList',
    };
    const [reqState, setReqState] = useState(reqNum.reqSend);
    const [loading, setLoading] = useState(false);
    const [listReq, setListReq] = useState([]);

    const [isNewReqRes, setIsNewReqRes] = useState(false);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', user.user_id);
        const collectionRef = collection(userDocRef, reqState);
        setLoading(true);
        setListReq([]);
        const unsubscribe = onSnapshot(collectionRef, async (querySnapshot) => {
            const listRequest = [];
            Promise.all(
                querySnapshot.docs.map((doc) => {
                    listRequest.push({ id: doc.id, data: doc.data() });
                    return doc.id;
                }),
            );
            setListReq(listRequest);
        });
        setLoading(false);
        // Clean-up function để huỷ đăng ký lắng nghe khi component bị unmount
        return () => {
            unsubscribe();
        };
    }, [reqState, user.user_id]);

    useEffect(() => {
        const reqResColRef = collection(getFirestore(app), 'users', user.user_id, reqNum.reqRes);
        const unSub_reqResColRef = onSnapshot(reqResColRef, (querySnapshot) => {
            setIsNewReqRes(!querySnapshot.empty);
        });
        return () => {
            unSub_reqResColRef();
        };
    });

    const removeReq = (_id) => {
        const updatedList = listReq.filter((item) => item.id !== _id);
        setListReq(updatedList);
    };
    return (
        <div className="profileReq_main">
            <div className="req_nav">
                <div className="req_nav_btn">
                    <button className={reqState === reqNum.reqRes ? 'selected' : ''} onClick={() => setReqState(reqNum.reqRes)}>
                        Request Receive
                    </button>
                    {isNewReqRes ? <span className="have_new_notify"></span> : null}
                </div>
                <div className="req_nav_btn">
                    <button className={reqState === reqNum.reqSend ? 'selected' : ''} onClick={() => setReqState(reqNum.reqSend)}>
                        Request Send
                    </button>
                </div>
                <div className="req_nav_btn">
                    <button className={reqState === reqNum.Friends ? 'selected' : ''} onClick={() => setReqState(reqNum.Friends)}>
                        Friends
                    </button>
                </div>
                <div className="req_nav_btn">
                    <button
                        className={reqState === reqNum.BlockList ? 'selected' : ''}
                        onClick={() => setReqState(reqNum.BlockList)}
                    >
                        Block List
                    </button>
                </div>
            </div>
            <div className="profileItem_container">
                {loading ? (
                    <Loader loader_color="2" />
                ) : (
                    listReq.map((item) => {
                        return <ProfileReqItem key={item.id} uid={item.id} category={reqState} onDeleteComponent={removeReq} />;
                    })
                )}
            </div>
        </div>
    );
}

export default ProfileReq;
