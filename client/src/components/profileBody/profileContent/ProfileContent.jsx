import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './profileContent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Loader from '../../loader/Loader';
import app from '../../../configs/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

function ProfileContent(props) {

    const [loading, setLoading] = useState(false);
    const [userFetchData, setUserFetchData] = useState('');
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(getFirestore(app), 'users', user.user_id), (doc) => {
            setLoading(true);
            setUserFetchData(doc.data());
            setLoading(false);
        });
        // Clean-up function để huỷ đăng ký lắng nghe khi component bị unmount
        return () => {
            unsubscribe();
        };
    }, [user]);

    const spanRef = useRef(null);
    const copyText = () => {
        if (spanRef.current) {
            const spanText = spanRef.current.innerText;
            const textArea = document.createElement('textarea');
            textArea.value = spanText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    return (
        <>
            <div className="profileContent__main">
                {loading ? (
                    <Loader loader_color="1" />
                ) : (
                    <>
                        <div className="prfCnt__opt__main">
                            <div className="prfCnt__opt">
                                <i>
                                    <FontAwesomeIcon size="xl" cursor="pointer" icon="fa-solid fa-ellipsis" />
                                </i>
                                <div className="prfCnt__opt_contain">
                                    <button onClick={() => props.showModal(false)}>Change password</button>
                                </div>
                            </div>
                        </div>
                        <img height="170vw" width="170vw" src={`${userFetchData.img}&${Date.now()}`}></img>
                        <h2>{userFetchData.name}</h2>
                        <button onClick={() => props.showModal(true)}>
                            <FontAwesomeIcon icon="fa-solid fa-pen" /> Change your profile
                        </button>
                        <span className="user_id_span">
                            ID:
                            <span ref={spanRef} onClick={copyText}>
                                {userFetchData.userID}
                            </span>
                        </span>
                    </>
                )}
            </div>
        </>
    );
}

export default ProfileContent;
