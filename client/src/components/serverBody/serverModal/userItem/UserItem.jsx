import React, { useEffect, useState } from 'react';
import './userItem.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import RoleToSelect from './RoleToSelect';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';
import axiosInstance from '../../../../configs/axiosConfig';
import UserProfile from '../userProfile/UserProfile';

function UserItem(props) {
    const dispatch = useDispatch();
    const [memberSettingOpen, setMemberSettingOpen] = useState(false);
    const { serverSelect, serverOwner, isHaveAdminPermission } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken, user } = useSelector((state) => state.persistedReducer.authReducer);

    const [memberData, setMemberData] = useState();
    const [openRoleSelect, setOpenRoleSelect] = useState(false);

    const [haveKickUserPerm, setHaveKickUserPerm] = useState(false);
    const [haveBanUserPerm, setHaveBanUserPerm] = useState(false);

    const [profileToShow, setProfileToShow] = useState();

    useEffect(() => {
        const memberDocRef = doc(getFirestore(app), 'servers', serverSelect, 'members', props.memberId);
        const userDocRef = doc(getFirestore(app), 'users', props.memberId);
        const unSub = onSnapshot(memberDocRef, (member) => {
            getDoc(userDocRef).then(async (user) => {
                setMemberData({
                    id: member.id,
                    roles: await member.data().roles,
                    img: await user.data().img,
                    name: await user.data().name,
                });
            });
        });

        //Kick user permissions
        if (isHaveAdminPermission === true || serverOwner === user.user_id) {
            setHaveKickUserPerm(true);
            setHaveBanUserPerm(true);
        } else {
            axiosInstance
                .post('/api/permission/checkServerPerm', {
                    idToken: userToken,
                    serverId: serverSelect,
                    permId: 'B1',
                    stackTypeFlags: false,
                })
                .then((response) => {
                    setHaveKickUserPerm(response.data.enable);
                });
            //Ban User permissions
            axiosInstance
                .post('/api/permission/checkServerPerm', {
                    idToken: userToken,
                    serverId: serverSelect,
                    permId: 'B2',
                    stackTypeFlags: false,
                })
                .then((response) => {
                    setHaveBanUserPerm(response.data.enable);
                });
        }

        return () => {
            unSub();
        };
    }, [props, serverSelect, userToken, isHaveAdminPermission, serverOwner, user.user_id]);

    const removeUserFromServer = (uid) => {
        const serverDocRef = doc(getFirestore(app), 'servers', serverSelect);
        getDoc(serverDocRef).then(async (server) => {
            if (server.data().owner === uid) {
                dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'You can not kick yourself !' }));
            } else {
                try {
                    const { data } = await axiosInstance.post('/api/server/removeUserFromServer', {
                        idToken: userToken,
                        userTarget: uid,
                        serverId: serverSelect,
                    });
                    dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Remove user from server successfuly !' }));
                } catch (err) {
                    console.log(err);
                }
            }
        });
    };

    const banUserFromServer = (uid) => {
        const serverDocRef = doc(getFirestore(app), 'servers', serverSelect);
        getDoc(serverDocRef).then(async (server) => {
            if (server.data().owner === uid) {
                dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'You can not ban yourself !' }));
            } else {
                try {
                    const { data } = await axiosInstance.post('/api/server/removeUserFromServer', {
                        idToken: userToken,
                        userTarget: uid,
                        serverId: serverSelect,
                        isBan: true,
                    });
                    dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Ban user from server successfuly !' }));
                } catch (err) {
                    console.log(err);
                }
            }
        });
    };

    const removeBan = async (uid) => {
        try {
            const { data } = await axiosInstance.post('/api/server/removeBan', {
                idToken: userToken,
                targetUser: uid,
                serverId: serverSelect,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Remove user from ban list successfuly !' }));
            props.removeBanItem();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <>
            <div style={{ padding: '2px 10px' }} className="main_role_item">
                <img
                    style={{ marginRight: '25px', width: '30px', height: '30px', borderRadius: '50%' }}
                    src={memberData?.img}
                ></img>
                <h3 style={{ flexGrow: '2' }}>{memberData?.name}</h3>
                {props.banType === false ? (
                    <div style={{ display: 'flex' }}>
                        {props.haveManageRolePerm ? (
                            <button
                                className="user_item_btn_addRole"
                                onClick={() => {
                                    setOpenRoleSelect(!openRoleSelect);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-plus" />
                            </button>
                        ) : null}
                        {openRoleSelect ? <RoleToSelect memberId={memberData?.id} /> : null}
                    </div>
                ) : (
                    <div style={{ display: 'flex' }}>
                        {props.haveManageRolePerm ? (
                            <button className="user_item_btn_addRole" onClick={() => removeBan(memberData?.id)}>
                                <FontAwesomeIcon icon="fa-solid fa-user-minus" />
                            </button>
                        ) : null}
                    </div>
                )}
                <div>
                    <button onClick={() => setMemberSettingOpen(!memberSettingOpen)}>
                        <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
                    </button>
                    <div style={memberSettingOpen ? null : { display: 'none' }} className="main_role_setting_box">
                        <button onClick={() => setProfileToShow(memberData?.id)}>Profile</button>
                        {haveKickUserPerm === true && props.banType === false ? (
                            <button onClick={() => removeUserFromServer(memberData.id)}>Kick</button>
                        ) : null}
                        {haveBanUserPerm === true && props.banType === false ? (
                            <button onClick={() => banUserFromServer(memberData.id)}>Ban</button>
                        ) : null}
                    </div>
                </div>
            </div>
            {profileToShow ? <UserProfile userId={profileToShow} closeModal={() => setProfileToShow(null)} /> : null}
        </>
    );
}

export default UserItem;
