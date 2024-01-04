import React, { useEffect, useState } from 'react';
import './userProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../../../configs/firebase';

function UserProfile(props) {
    const [userData, setUserData] = useState();

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', props.userId);
        getDoc(userDocRef).then(async (user) => {
            setUserData(user.data());
        });
    }, [props.userId]);

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Member</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="profileModal_container">
                    <img src={userData?.img}></img>
                    <h3>{userData?.name}</h3>
                    <h4>{userData?.userID}</h4>
                </div>
                <div className="serverModal_box_actBtn">
                    <button onClick={() => props.closeModal()}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
