import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import app from '../../../../configs/firebase';
import ConfirmDeleteUserModal from './ConfirmDeleteUserModal';
import AddUserToRole from './AddUserToRole';
import Switch from '../../../_switch/Switch';
import axiosInstance from '../../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function MangeRoleUserModal(props) {
    const dispatch = useDispatch();

    const _nav = {
        user: 0,
        display: 1,
        permission: 2,
    };

    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const [roleUserList, setRoleUserList] = useState([]);
    const [confirmDelModal, setConfirmDelModal] = useState(false);
    const [addUserToRoleModal, setAddUserToRoleModal] = useState(false);

    const [roleNav, setRoleNav] = useState(_nav.permission);

    const [roleColor, setRoleColor] = useState('#ff0000');
    const [roleName, setRoleName] = useState('');
    const [rolePermission, setRolePermission] = useState([]);

    const rName = useRef();
    const rColor = useRef();
    const [newRolePermission, setNewRolePermission] = useState([]);

    const [haveChange, setHaveChange] = useState(false);

    const [addable, setAddable] = useState('true');

    function getUserData(id) {
        return new Promise((resolve) => {
            const userDocRef = doc(getFirestore(app), 'users', id);
            getDoc(userDocRef).then((user) => {
                resolve({
                    id: user.id,
                    name: user.data().name,
                    img: user.data().img,
                });
            });
        });
    }

    const removeUserFromRole = (id) => {
        setConfirmDelModal(id);
    };

    useEffect(() => {
        const serverRoleDocRef = doc(getFirestore(app), 'servers', serverSelect, 'roles', props.roleData.roleId);
        const unSub = onSnapshot(serverRoleDocRef, async (snapshot) => {
            if (snapshot.exists()) {
                if (snapshot.data().addable) {
                    let newList = [];
                    await Promise.all(
                        snapshot.data().members.map(async (member) => {
                            let temp = await getUserData(member);
                            newList.push(temp);
                            return member;
                        }),
                    );
                    setRoleName(snapshot.data().roleName);
                    setRoleColor(snapshot.data().color);
                    setRoleUserList([...newList]);
                } else {
                    setAddable(snapshot.data().addable);
                }
                // permission
                const permRef = collection(serverRoleDocRef, 'role_permissions');
                const permSnapshot = await getDocs(permRef);
                let tempPermissions = {};
                await Promise.all(
                    permSnapshot.docs.map(async (doc, index) => {
                        tempPermissions[doc.id] = doc.data().enable;
                    }),
                );
                setRolePermission(tempPermissions);
                setNewRolePermission(tempPermissions);
            }
        });
        return () => {
            unSub();
        };
    }, [props.roleData.roleId, serverSelect]);

    const openAddUserToRole = () => {
        setAddUserToRoleModal(true);
    };

    function isEquivalent(obj1, obj2) {
        let keys1 = Object.keys(obj1);
        let keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
    }

    const saveRoleChange = () => {
        if (roleNav === _nav.display) {
            axiosInstance
                .put('/api/server/updateRole', {
                    idToken: userToken,
                    roleId: props.roleData.roleId,
                    roleNewName: rName.current.value,
                    roleColor: rColor.current.value,
                    serverId: serverSelect,
                })
                .then(() => {
                    dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Role updated !' }));
                    setHaveChange(false);
                });
        } else if (roleNav === _nav.permission) {
            axiosInstance
                .put('/api/server/updateRolePermisson', {
                    idToken: userToken,
                    roleId: props.roleData.roleId,
                    permissions: newRolePermission,
                    serverId: serverSelect,
                })
                .then(() => {
                    setRolePermission(newRolePermission);
                    dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Role updated !' }));
                    setHaveChange(false);
                });
        }
    };

    const updateNewRoleColor = () => {
        setHaveChange(true);
    };

    const updateNewRoleName = () => {
        if (rName.current.value?.trim() !== roleName) {
            setHaveChange(true);
        } else {
            setHaveChange(false);
        }
    };

    const togglePemission = (index) => {
        let temp = { ...newRolePermission };
        temp[index] = !temp[index];
        setNewRolePermission(temp);
        setHaveChange(isEquivalent(newRolePermission, rolePermission));
    };

    return (
        <>
            <div className="serverModal_main">
                <div className="serverModal_box">
                    <div className="serverModal_box_close">
                        <h1>Manage User Role</h1>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                    </div>
                    <div className="serverModal_box_input">
                        <div className="role_nav_container">
                            {addable ? (
                                <>
                                    <button
                                        className={roleNav === _nav.display ? 'selected' : ''}
                                        onClick={() => setRoleNav(_nav.display)}
                                    >
                                        Display
                                    </button>
                                    <button
                                        className={roleNav === _nav.user ? 'selected' : ''}
                                        onClick={() => setRoleNav(_nav.user)}
                                    >
                                        User
                                    </button>
                                </>
                            ) : null}
                            <button
                                className={roleNav === _nav.permission ? 'selected' : ''}
                                onClick={() => setRoleNav(_nav.permission)}
                            >
                                Permission
                            </button>
                        </div>
                        {roleNav === _nav.user ? (
                            <>
                                <button className="role_user_addUser" onClick={openAddUserToRole}>
                                    Add user
                                </button>
                                <div className="role_user_list">
                                    {roleUserList?.map((roleUser) => {
                                        return (
                                            <div key={roleUser.id} className="role_user_list_item">
                                                <img src={roleUser.img}></img>
                                                <p>{roleUser.name}</p>
                                                <FontAwesomeIcon
                                                    onClick={() => removeUserFromRole(roleUser.id)}
                                                    icon="fa-solid fa-circle-xmark"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : null}
                        {roleNav === _nav.display ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Role name"
                                    required
                                    defaultValue={roleName}
                                    ref={rName}
                                    onChange={updateNewRoleName}
                                ></input>
                                <div style={{ padding: '10px', display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginRight: '10px' }}>Select role color: </label>
                                    <input
                                        style={{ height: '40px' }}
                                        type="color"
                                        defaultValue={roleColor}
                                        ref={rColor}
                                        onChange={updateNewRoleColor}
                                    ></input>
                                </div>
                            </>
                        ) : null}
                        {roleNav === _nav.permission ? (
                            <>
                                <div className="role_permission_container">
                                    <h5>General server permission</h5>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>View Rooms</label>
                                            <Switch
                                                defautData={newRolePermission['0A0']}
                                                switchToggleData={() => togglePemission('0A0')}
                                            />
                                        </div>
                                        <p>Allow viewing rooms channel (Private rooms are not included)</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Manage Rooms</label>
                                            <Switch
                                                defautData={newRolePermission['0A1']}
                                                switchToggleData={() => togglePemission('0A1')}
                                            />
                                        </div>
                                        <p>Allows creating, editing and deleting rooms</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Manage Roles</label>
                                            <Switch
                                                defautData={newRolePermission['0A2']}
                                                switchToggleData={() => togglePemission('0A2')}
                                            />
                                        </div>
                                        <p>Manage roles (add, remove role members and edit permissions)</p>
                                    </div>
                                    <h5>Member permission</h5>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Invite people</label>
                                            <Switch
                                                defautData={newRolePermission['0B0']}
                                                switchToggleData={() => togglePemission('0B0')}
                                            />
                                        </div>
                                        <p>Send invitations (including viewing the invitation key)</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Kick user</label>
                                            <Switch
                                                defautData={newRolePermission['0B1']}
                                                switchToggleData={() => togglePemission('0B1')}
                                            />
                                        </div>
                                        <p>Kick the user off the server</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Ban user</label>
                                            <Switch
                                                defautData={newRolePermission['0B2']}
                                                switchToggleData={() => togglePemission('0B2')}
                                            />
                                        </div>
                                        <p>Ban users from the server (cannot re-enter unless unbanned)</p>
                                    </div>
                                    <h5>Text room permission</h5>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Send message</label>
                                            <Switch
                                                defautData={newRolePermission['0C0']}
                                                switchToggleData={() => togglePemission()}
                                            />
                                        </div>
                                        <p>Allow members to send messages in chat</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Send URL</label>
                                            <Switch
                                                defautData={newRolePermission['0C1']}
                                                switchToggleData={() => togglePemission('0C1')}
                                            />
                                        </div>
                                        <p>Allow members to send links in chat</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Send File</label>
                                            <Switch
                                                defautData={newRolePermission['0C2']}
                                                switchToggleData={() => togglePemission('0C2')}
                                            />
                                        </div>
                                        <p>Allow members to send files in chat (not including photos and videos)</p>
                                    </div>
                                    <h5>Voice room permission</h5>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Connect</label>
                                            <Switch
                                                defautData={newRolePermission['0D0']}
                                                switchToggleData={() => togglePemission('0D0')}
                                            />
                                        </div>
                                        <p>Allows members to connect to the voice room</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Speak</label>
                                            <Switch
                                                defautData={newRolePermission['0D1']}
                                                switchToggleData={() => togglePemission('0D1')}
                                            />
                                        </div>
                                        <p>Allows members to use the mic in the voice room</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Video</label>
                                            <Switch
                                                defautData={newRolePermission['0D2']}
                                                switchToggleData={() => togglePemission('0D2')}
                                            />
                                        </div>
                                        <p>Allow members to use the camera in a voice channel (including screen sharing)</p>
                                    </div>
                                    <div className="role_permission_item">
                                        <div>
                                            <label>Administrator</label>
                                            <Switch
                                                defautData={newRolePermission['E0']}
                                                switchToggleData={() => togglePemission('E0')}
                                            />
                                        </div>
                                        <p>
                                            This is the highest permission, the user will own all of the above rights if granted
                                            this permission. Be careful when giving this permission to anyone
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                    <div className="serverModal_box_actBtn">
                        <button onClick={() => props.closeModal()}>Close</button>
                        {roleNav !== _nav.user && haveChange === true ? (
                            <button style={{ backgroundColor: 'green' }} onClick={saveRoleChange}>
                                Save
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            {confirmDelModal ? (
                <ConfirmDeleteUserModal
                    uidToDel={confirmDelModal}
                    targetRole={props.roleData.roleId}
                    closeModal={() => setConfirmDelModal(false)}
                />
            ) : null}
            {addUserToRoleModal ? (
                <AddUserToRole roleId={props.roleData.roleId} closeModal={() => setAddUserToRoleModal(false)} />
            ) : null}
        </>
    );
}

export default MangeRoleUserModal;
