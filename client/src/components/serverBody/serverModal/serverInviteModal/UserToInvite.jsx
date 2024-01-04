import { doc, getDoc, getFirestore } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import app from '../../../../configs/firebase';
import axiosInstance from '../../../../configs/axiosConfig';
import { useSelector } from 'react-redux';

function UserToInvite(props) {
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const [uData, setUData] = useState();
    const [isInvited, setIsInvited] = useState(false);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', props.friendId);
        getDoc(userDocRef).then(async (user) => {
            setUData({
                id: user.id,
                name: await user.data().name,
                img: await user.data().img,
            });
        });
    }, [props.friendId]);

    const handleInviteClick = async () => {
        if (!isInvited) {
            await axiosInstance.post('api/server/inviteToServer', {
                idToken: userToken,
                userToInvite: props.friendId,
                serverId: serverSelect,
            });
            setIsInvited(true);
        }
    };

    return (
        <div className="user_to_invite_item_main">
            <img src={uData?.img}></img>
            <p>{uData?.name}</p>
            <button className={isInvited ? 'invited' : ''} onClick={handleInviteClick}>
                {isInvited ? 'Invited' : 'Invite'}
            </button>
        </div>
    );
}

export default UserToInvite;
