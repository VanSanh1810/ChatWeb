import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import app from '../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import Switch from '../../_switch/Switch';
import axiosInstance from '../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';
import UseNRoleToAdd from './useNRoleToAdd';
import ConfirmDeleteChannel from '../serverModal/confirmDeleteChannelModal/ConfirmDeleteChannel';
import ChannelPermisson from './ChannelPermisson';

function ChannelSettingModal(props) {
    const dispatch = useDispatch();
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const navArr = {
        setName: 0,
        manageAccess: 1,
        channelPermissions: 2,
    };
    const [navPos, setNavPos] = useState(navArr.setName);
    const [roleNUserList, setRoleNUserList] = useState([]);

    const [memberList, setMemberList] = useState([]);
    const [roleList, setRoleList] = useState([]);
    const [isPrivate, setIsPrivate] = useState();
    const [defaultPrivate, setDefaultPrivate] = useState();
    const [hasChanged, setHasChanged] = useState(false);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

    const channelNameRef = useRef();
    const [channelName, setChannelName] = useState();

    const [userAndRoleToSelect, setUserAndRoleToSelect] = useState(false);

    useEffect(() => {
        const channelDocRef = doc(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId);
        const unSub = onSnapshot(channelDocRef, async (snapshot) => {
            setIsPrivate(await snapshot.data().private);
            setDefaultPrivate(await snapshot.data().private);
            setChannelName(await snapshot.data().chanelName);
            const memList = await snapshot.data().members;
            const userColRef = collection(getFirestore(app), 'users');
            setMemberList(
                await Promise.all(
                    memList.map(async (user) => {
                        const member = await getDoc(doc(userColRef, user));
                        return {
                            id: member.id,
                            name: await member.data().name,
                            img: await member.data().img,
                        };
                    }),
                ),
            );
            setRoleList(await snapshot.data().roles);
        });

        const unSub2 = onSnapshot(collection(channelDocRef, 'roles'), async (snapshot) => {
            const roleColRef = collection(getFirestore(app), 'servers', serverSelect, 'roles');
            setRoleList(
                await Promise.all(
                    snapshot.docs.map(async (role) => {
                        const role1 = await getDoc(doc(roleColRef, role.id));
                        return { id: role.id, name: role1.data().roleName };
                    }),
                ),
            );
        });

        const unSub3 = onSnapshot(collection(channelDocRef, 'members'), async (snapshot) => {
            const userColRef = collection(getFirestore(app), 'users');
            setMemberList(
                await Promise.all(
                    snapshot.docs.map(async (member) => {
                        const memUser = await getDoc(doc(userColRef, member.id));
                        return {
                            id: memUser.id,
                            name: await memUser.data().name,
                            img: await memUser.data().img,
                        };
                    }),
                ),
            );
        });
        return () => {
            unSub();
            unSub2();
            unSub3();
        };
    }, [props.channelId, serverSelect]);

    const checkNameChange = () => {
        setHasChanged(channelNameRef.current.value !== channelName);
    };

    const saveChannelNameChanged = () => {
        try {
            axiosInstance.put('api/server/updateChannel', {
                idToken: userToken,
                channelId: props.channelId,
                serverId: serverSelect,
                newName: channelNameRef.current.value,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Channel updated !' }));
            props.closeModal();
        } catch (error) {
            console.log(error);
        }
    };

    const saveChannelPrivateChanged = () => {
        try {
            axiosInstance.put('api/server/updateChannel', {
                idToken: userToken,
                channelId: props.channelId,
                serverId: serverSelect,
                isPrivate: isPrivate,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Channel updated !' }));
            props.closeModal();
        } catch (error) {
            console.log(error);
        }
    };

    const removeAccessFromChannel = (id, type) => {
        try {
            axiosInstance.put('api/server/removeAccessFromChannel', {
                idToken: userToken,
                channelId: props.channelId,
                serverId: serverSelect,
                data: id,
                type: type,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Channel updated !' }));
        } catch (error) {
            console.log(error);
        }
    };

    const deleteChannel = () => {
        setConfirmDeleteModal(true);
    };

    return (
        <>
            <div className="serverModal_main">
                <div className="serverModal_box">
                    <div className="serverModal_box_close">
                        <h1>Channel Setting</h1>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                    </div>
                    <div className="serverSetting_modal_nav">
                        <button
                            onClick={() => {
                                setNavPos(navArr.setName);
                                setHasChanged(false);
                                setUserAndRoleToSelect(false);
                            }}
                            className={navPos === navArr.setName ? 'selected' : ''}
                        >
                            General
                        </button>
                        <button
                            onClick={() => {
                                setNavPos(navArr.manageAccess);
                                setHasChanged(false);
                                setUserAndRoleToSelect(false);
                            }}
                            className={navPos === navArr.manageAccess ? 'selected' : ''}
                        >
                            Access
                        </button>
                        <button
                            onClick={() => {
                                setNavPos(navArr.channelPermissions);
                                setHasChanged(false);
                                setUserAndRoleToSelect(false);
                            }}
                            className={navPos === navArr.channelPermissions ? 'selected' : ''}
                        >
                            Permission
                        </button>
                        <button style={{ color: '#ff3333', flexGrow: 1 }} onClick={deleteChannel}>
                            Delete
                        </button>
                    </div>
                    {userAndRoleToSelect ? (
                        <UseNRoleToAdd
                            closeModal={() => {
                                setUserAndRoleToSelect(false);
                                props.closeModal();
                            }}
                            channelId={props.channelId}
                        />
                    ) : (
                        <div className="serverModal_box_input">
                            {navPos === navArr.setName ? (
                                <>
                                    <label>New channel name</label>
                                    <input
                                        type="text"
                                        placeholder="Channel name"
                                        ref={channelNameRef}
                                        defaultValue={channelName}
                                        onChange={() => checkNameChange()}
                                    ></input>
                                </>
                            ) : navPos === navArr.manageAccess ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0px' }}>
                                        <p>Private</p>
                                        <Switch
                                            defautData={isPrivate}
                                            switchToggleData={() => {
                                                setIsPrivate(!isPrivate);
                                                setHasChanged(!hasChanged);
                                            }}
                                        />
                                    </div>
                                    {isPrivate ? (
                                        <>
                                            <button
                                                className="role_user_addUser"
                                                style={{ marginTop: '10px' }}
                                                onClick={() => setUserAndRoleToSelect(true)}
                                            >
                                                Add user/Role
                                            </button>
                                            <div className="role_user_list">
                                                {roleList.length > 0 ? <span>Roles</span> : null}
                                                {roleList?.map((role) => {
                                                    if (role.id === '0') {
                                                        return null;
                                                    }
                                                    return (
                                                        <div key={role.id} className="role_user_list_item">
                                                            <FontAwesomeIcon
                                                                style={{ margin: '8px' }}
                                                                icon="fa-solid fa-user-gear"
                                                            />
                                                            <p>{role.name}</p>
                                                            <FontAwesomeIcon
                                                                icon="fa-solid fa-circle-xmark"
                                                                onClick={() => removeAccessFromChannel(role.id, 'role')}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                {memberList.length > 0 ? <span>Members</span> : null}
                                                {memberList?.map((user) => {
                                                    return (
                                                        <div key={user.id} className="role_user_list_item">
                                                            <img src={user.img}></img>
                                                            <p>{user.name}</p>
                                                            <FontAwesomeIcon
                                                                icon="fa-solid fa-circle-xmark"
                                                                onClick={() => removeAccessFromChannel(user.id, 'member')}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    )}
                    {navPos === navArr.channelPermissions ? (
                        <ChannelPermisson closeModal={() => props.closeModal()} channelId={props.channelId} />
                    ) : null}
                    <div className="serverModal_box_actBtn">
                        {navPos === navArr.setName ? (
                            hasChanged ? (
                                <button style={{ backgroundColor: 'green' }} onClick={saveChannelNameChanged}>
                                    Save
                                </button>
                            ) : null
                        ) : hasChanged ? (
                            userAndRoleToSelect ? null : (
                                <button style={{ backgroundColor: 'green' }} onClick={saveChannelPrivateChanged}>
                                    Save
                                </button>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
            {confirmDeleteModal ? (
                <ConfirmDeleteChannel closeModal={() => setConfirmDeleteModal(false)} channelId={props.channelId} />
            ) : null}
        </>
    );
}

export default ChannelSettingModal;
