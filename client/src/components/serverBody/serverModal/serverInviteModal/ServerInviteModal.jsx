import React, { useEffect, useState } from 'react';
import './serverInviteModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useSelector } from 'react-redux';
import UserToInvite from './UserToInvite';
import axiosInstance from '../../../../configs/axiosConfig';

function ServerInviteModal(props) {
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const [memberToInviteList, setMemberToInviteList] = useState([]);
    const [inviteKey, setInviteKey] = useState([]);

    useEffect(() => {
        try {
            axiosInstance
                .post('api/server/getServerInviteKey', {
                    idToken: userToken,
                    serverId: serverSelect,
                })
                .then(async (response) => {
                    setInviteKey(await response.data.inviteKey);
                })
                .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        const friendListColRef = collection(getFirestore(app), 'users', user.user_id, 'friendList');
        const unSub = onSnapshot(friendListColRef, async (friends) => {
            const serverMemberRef = collection(getFirestore(app), 'servers', serverSelect, 'members');
            let serverMemList = [];
            let friendList = [];
            const serverMemberList = await getDocs(serverMemberRef);
            Promise.all([
                Promise.all([
                    serverMemberList.docs.map(async (doc, index) => {
                        serverMemList.push(doc.id);
                        return index;
                    }),
                ]),
                Promise.all([
                    friends.docs.forEach(async (friend, index) => {
                        friendList.push(friend.id);
                        return index;
                    }),
                ]),
            ]).then(async () => {
                let resultList = await Promise.all([
                    friendList.filter(async (friend, index) => {
                        if (serverMemList.indexOf(friend) === -1) {
                            return false;
                        }
                        return true;
                    }),
                ]);
                setMemberToInviteList([...resultList[0]]);
            });
        });
    }, []);

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Invite People</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <input style={{ marginTop: '10px' }} placeholder="Search Friend" type="text" spellCheck={false}></input>
                    <div className="roles_container">
                        {memberToInviteList.map((friendId, index) => {
                            return <UserToInvite key={index} friendId={friendId} />;
                        })}
                    </div>
                    <p style={{ marginTop: '20px' }}>Or send them invite key</p>
                    <input
                        style={{ marginTop: '10px' }}
                        type="text"
                        spellCheck={false}
                        onKeyPress={(e) => e.preventDefault()}
                        defaultValue={inviteKey ? inviteKey : ''}
                    ></input>
                    {/* <p style={{ opacity: '40%', fontSize: '14px' }}>This key will expire after 7 days</p> */}
                </div>
            </div>
        </div>
    );
}

export default ServerInviteModal;
