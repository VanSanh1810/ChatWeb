import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import './addRoleModal.css';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';
import axiosInstance from '../../../../configs/axiosConfig';

function AddRoleModal(props) {
    const dispatch = useDispatch();

    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const [listMember, setListMember] = useState([]);
    const [listSelectedMember, setListSelectedMember] = useState([]);

    const newRoleName = useRef();

    useEffect(() => {
        const serverMemberColRef = collection(getFirestore(app), 'servers', serverSelect, 'members');
        getDocs(serverMemberColRef).then(async (members) => {
            let tempList = [];
            const userColRef = collection(getFirestore(app), 'users');
            await Promise.all(
                members.docs.map(async (member, index) => {
                    await getDoc(doc(userColRef, member.id)).then(async (u) => {
                        tempList.push({
                            uid: u.id,
                            name: u.data().name,
                            img: u.data().img,
                        });
                    });
                    return index;
                }),
            );
            setListMember(tempList);
        });
    }, [serverSelect]);

    const toggleSelectedMember = (memberData) => {
        let tempList = [...listSelectedMember];
        if (tempList.some((obj) => obj.id === memberData.id)) {
            setListSelectedMember(tempList.filter((item) => item.id !== memberData.id));
        } else {
            tempList.push(memberData);
            setListSelectedMember(tempList);
        }
    };

    const removeMemberSelected = (memberData) => {
        const checkBox = document.getElementById(memberData.id);
        checkBox.checked = false;
        let tempList = [...listSelectedMember];
        setListSelectedMember(tempList.filter((item) => item.id !== memberData.id));
    };

    useEffect(() => {
        console.log(listSelectedMember);
    }, [listSelectedMember]);

    const addRoleClick = async () => {
        if (newRoleName?.current.value.trim()) {
            try {
                const { data } = await axiosInstance.post('/api/server/createRole', {
                    idToken: userToken,
                    roleName: newRoleName.current.value,
                    roleUser: listSelectedMember.map((user) => user.id),
                    serverId: serverSelect,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Create role successfuly !' }));
            } catch (err) {
                console.log(err);
            }
        } else {
            dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'Please provide role name !!' }));
        }
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Create new Role</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <label>New role name</label>
                    <input type="text" placeholder="Role name" ref={newRoleName}></input>
                    <label style={{ marginTop: '20px' }}>Add role user</label>
                    <div className="role_list_selected_member">
                        {listSelectedMember.map((member, index) => {
                            return (
                                <span key={member.id} onClick={() => removeMemberSelected({ id: member.id, name: member.name })}>
                                    <FontAwesomeIcon icon="fa-solid fa-xmark" />
                                    {member.name}
                                </span>
                            );
                        })}
                    </div>
                    <div className="list_user_include">
                        {listMember.map((member, index) => {
                            return (
                                <div key={index} className="list_user_include_item">
                                    <input
                                        id={member.uid}
                                        type="checkbox"
                                        onChange={() => toggleSelectedMember({ id: member.uid, name: member.name })}
                                    />
                                    <img src={member.img}></img>
                                    <h4>{member.name}</h4>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="serverModal_box_actBtn">
                    <button style={{ backgroundColor: 'green' }} onClick={addRoleClick}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddRoleModal;
