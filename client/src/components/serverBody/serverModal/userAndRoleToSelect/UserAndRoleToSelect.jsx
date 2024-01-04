import React, { useEffect, useState } from 'react';
import './userAndRoleToSelect.css';
import { collection, getDoc, getDocs, getFirestore, doc } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function UserAndRoleToSelect(props) {
    const dispatch = useDispatch();
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const [memberList, setMemberList] = useState([]);
    const [roleList, setRoleList] = useState([]);
    const [listSelected, setListSelected] = useState([]);

    const toggleRoleSelection = (roleId, roleName) => {
        const tempList = [...listSelected];
        const checkbox = document.getElementById(roleId);
        const index = tempList.findIndex((obj) => obj.type === 'role' && obj.id === roleId);
        if (index !== -1) {
            tempList.splice(index, 1);
            checkbox.checked = false;
        } else {
            tempList.push({ id: roleId, name: roleName, type: 'role' });
            checkbox.checked = true;
        }
        setListSelected(tempList);
    };

    const toggleMemberSelection = (memberId, memberName) => {
        const tempList = [...listSelected];
        const checkbox = document.getElementById(memberId);
        const index = tempList.findIndex((obj) => obj.type === 'member' && obj.id === memberId);
        if (index !== -1) {
            tempList.splice(index, 1);
            checkbox.checked = false;
        } else {
            tempList.push({ id: memberId, name: memberName, type: 'member' });
            checkbox.checked = true;
        }
        setListSelected(tempList);
    };

    useEffect(() => {
        const memberColRef = collection(getFirestore(app), 'servers', serverSelect, 'members');
        const roleColRef = collection(getFirestore(app), 'servers', serverSelect, 'roles');
        Promise.all([getDocs(memberColRef), getDocs(roleColRef)]).then((results) => {
            let roleDataList = [];
            let memberDataList = [];
            Promise.all([
                Promise.all(
                    results[0].docs.map(async (_doc) => {
                        const userDocRef = doc(getFirestore(app), 'users', _doc.id);
                        const data = await getDoc(userDocRef);
                        memberDataList.push({ id: _doc.id, name: await data.data().name, img: await data.data().img });
                        return _doc.id;
                    }),
                ),
                Promise.all(
                    results[1].docs.map((doc) => {
                        if (doc.id !== '0') {
                            roleDataList.push({ roleId: doc.id, roleName: doc.data().roleName });
                        }
                        return doc.id;
                    }),
                ),
            ]).then(() => {
                setMemberList(memberDataList);
                setRoleList(roleDataList);
            });
        });
    }, []);

    const createPrivateChannel = () => {
        try {
            axiosInstance.put('api/server/createChannel', {
                idToken: userToken,
                newChannelName: props.newChannelName,
                isPrivate: true,
                roleAndData: listSelected,
                serverId: serverSelect,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Create channel successfuly !' }));
            props.closeModal();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <div className="serverModal_box_input">
                <label>Select User/Role</label>
                <input type="text" spellCheck="false" placeholder="Find user or role"></input>
                <div className="role_list_selected_member">
                    {listSelected.map((item, index) => {
                        return (
                            <span
                                key={index}
                                onClick={() => {
                                    item.type === 'role'
                                        ? toggleRoleSelection(item.id, item.name)
                                        : toggleMemberSelection(item.id, item.name);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                                {item.type === 'role' ? item.name : item.name}
                            </span>
                        );
                    })}
                </div>
                <div className="user_role_to_select_container">
                    <div>
                        <label>Roles</label>
                        {roleList.map((role, index) => {
                            return (
                                <div key={role.roleId} className="user_role_to_select_item">
                                    <input
                                        id={role.roleId}
                                        type="checkbox"
                                        onChange={() => toggleRoleSelection(role.roleId, role.roleName)}
                                    ></input>
                                    <div className="user_role_to_select_item_data">
                                        <FontAwesomeIcon icon="fa-solid fa-user-gear" style={{ marginLeft: '5px' }} />
                                        <p>{role.roleName}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div>
                        <label>Members</label>
                        {memberList.map((member, index) => {
                            return (
                                <div key={member.id} className="user_role_to_select_item">
                                    <input
                                        id={member.id}
                                        type="checkbox"
                                        onChange={() => toggleMemberSelection(member.id, member.name)}
                                    ></input>
                                    <div className="user_role_to_select_item_data">
                                        <img src={member.img} />
                                        <p>{member.name}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="serverModal_box_actBtn">
                <button onClick={props.closeModal}>Close</button>
                <button onClick={() => createPrivateChannel()}>Create</button>
            </div>
        </>
    );
}

export default UserAndRoleToSelect;
