import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import app from '../../../configs/firebase';
import axiosInstance from '../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';

function UseNRoleToAdd(props) {
    const dispatch = useDispatch();
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
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
            const channelRoleColRef = collection(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId, 'roles');
            const channelMemColRef = collection(
                getFirestore(app),
                'servers',
                serverSelect,
                'chanels',
                props.channelId,
                'members',
            );
            Promise.all([getDocs(channelRoleColRef), getDocs(channelMemColRef)]).then((listDocs) => {
                let cRoleList = [];
                let cMemList = [];
                Promise.all([
                    Promise.all(
                        listDocs[0].docs.map(async (roleDoc, index) => {
                            cRoleList.push(roleDoc.id);
                            return index;
                        }),
                    ),
                    Promise.all(
                        listDocs[1].docs.map(async (memDoc, index) => {
                            cMemList.push(memDoc.id);
                            return index;
                        }),
                    ),
                ]).then(() => {
                    let roleDataList = [];
                    let memberDataList = [];
                    Promise.all([
                        Promise.all(
                            results[0].docs.map(async (_doc) => {
                                if (cMemList.indexOf(_doc.id) === -1) {
                                    const userDocRef = doc(getFirestore(app), 'users', _doc.id);
                                    const data = await getDoc(userDocRef);
                                    memberDataList.push({
                                        id: _doc.id,
                                        name: await data.data().name,
                                        img: await data.data().img,
                                    });
                                }
                                return _doc.id;
                            }),
                        ),
                        Promise.all(
                            results[1].docs.map(async (_doc) => {
                                if (cRoleList.indexOf(_doc.id) === -1) {
                                    const roleDocRef = doc(getFirestore(app), 'servers', serverSelect, 'roles', _doc.id);
                                    const data = await getDoc(roleDocRef);
                                    roleDataList.push({
                                        id: _doc.id,
                                        name: data.data().roleName,
                                    });
                                }
                                return _doc.id;
                            }),
                        ),
                    ]).then(() => {
                        setMemberList(memberDataList);
                        setRoleList(roleDataList);
                    });
                });
            });
        });
    }, [props.channelId, serverSelect]);

    const createAddAccessToPrivateChannel = () => {
        if (listSelected.length > 0) {
            try {
                axiosInstance.put('api/server/addAccessToChannel', {
                    idToken: userToken,
                    channelId: props.channelId,
                    roleAndData: listSelected,
                    serverId: serverSelect,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Add user/role successfuly !' }));
                props.closeModal();
            } catch (error) {
                console.log(error);
            }
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
                        {roleList.length > 0 ? <label>Roles</label> : null}
                        {roleList.map((role, index) => {
                            return (
                                <div key={role.id} className="user_role_to_select_item">
                                    <input
                                        id={role.id}
                                        type="checkbox"
                                        onChange={() => toggleRoleSelection(role.id, role.name)}
                                    ></input>
                                    <div className="user_role_to_select_item_data">
                                        <FontAwesomeIcon icon="fa-solid fa-user-gear" style={{ marginLeft: '5px' }} />
                                        <p>{role.name}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div>
                        {memberList.length > 0 ? <label>Members</label> : null}
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
                {listSelected.length > 0 ? <button onClick={() => createAddAccessToPrivateChannel()}>Save</button> : null}
            </div>
        </>
    );
}

export default UseNRoleToAdd;
