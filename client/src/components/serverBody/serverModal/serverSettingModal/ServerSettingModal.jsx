import React, { useEffect, useMemo, useRef, useState } from 'react';
import './serverSettingModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import axiosInstance from '../../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';
import RoleItem from '../roleItem/RoleItem';
import AddRoleModal from '../addRoleModal/AddRoleModal';
import UserItem from '../userItem/UserItem';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

function ServerSettingModal(props) {
    const storage = getStorage(app);
    const dispatch = useDispatch();
    const navArr = useMemo(() => {
        return {
            general: 0,
            roles: 1,
            users: 2,
            banList: 3,
        };
    }, []);
    const { serverSelect, isHaveAdminPermission, serverOwner } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken, user } = useSelector((state) => state.persistedReducer.authReducer);
    const [navPos, setNavPos] = useState(0);
    const [serverData, setServerData] = useState();
    const [isChanged, setIsChanged] = useState(false);
    const [newServerImg, setNewServerImg] = useState();
    const [listRole, setListRole] = useState([]);
    const [listRoleAfterChange, setListRoleAfterChange] = useState([]);

    const [roleOrderChange, setRoleOrderChange] = useState(false);
    const [listMember, setListMember] = useState([]);
    const [listBan, setListBan] = useState([]);

    const [addRoleModal, setAddRoleModal] = useState(false);

    const imgInputRef = useRef();
    const nameInputRef = useRef();

    const [haveManageRolePerm, setHaveManageRolePerm] = useState(false);

    useEffect(() => {
        console.log(1);
        const serverDocRef = doc(getFirestore(app), 'servers', serverSelect);
        switch (navPos) {
            case navArr.general: {
                getDoc(serverDocRef).then((server) => {
                    setServerData({
                        img: server.data().serverImg,
                        name: server.data().serverName,
                    });
                    nameInputRef.current.value = server.data().serverName;
                });
                break;
            }
            case navArr.roles: {
                break;
            }
            case navArr.users: {
                break;
            }
        }

        //role
        function sortArray(arr) {
            return new Promise((resolve, reject) => {
                arr.sort((a, b) => a.order - b.order);
                resolve(arr);
            });
        }
        const roleCollection = collection(getFirestore(app), 'servers', serverSelect, 'roles');
        const unSub = onSnapshot(roleCollection, async (roles) => {
            let tempRoleList = [];
            await Promise.all(
                roles.docs.map(async (role) => {
                    tempRoleList.push({ id: role.id, order: role.data().order });
                    return role;
                }),
            ).then(() => {
                sortArray(tempRoleList).then((sortedArray) => {
                    setListRole(sortedArray);
                    setListRoleAfterChange(sortedArray);
                });
            });
        });
        //users
        const memberCollection = collection(getFirestore(app), 'servers', serverSelect, 'members');
        const unSub2 = onSnapshot(memberCollection, async (members) => {
            let tempMemberList = [];
            await Promise.all(
                members.docs.map((member) => {
                    tempMemberList.push(member.id);
                    return member;
                }),
            );
            setListMember(tempMemberList);
        });
        //banList
        const banRef = doc(getFirestore(app), 'servers', serverSelect);
        getDoc(banRef).then(async (members) => {
            setListBan(await members.data().banList);
        });
        return () => {
            unSub();
            unSub2();
        };
    }, [navPos, serverSelect, navArr]);

    useEffect(() => {
        setIsChanged(false);
        setRoleOrderChange(false);
        //Role management
        if (isHaveAdminPermission === true || serverOwner === user.user_id) {
            setHaveManageRolePerm(true);
        } else {
            axiosInstance
                .post('/api/permission/checkServerPerm', {
                    idToken: userToken,
                    serverId: serverSelect,
                    permId: 'A2',
                    stackTypeFlags: false,
                })
                .then((response) => {
                    setHaveManageRolePerm(response.data.enable);
                });
        }
    }, [navPos, serverSelect, userToken, isHaveAdminPermission, serverOwner, user.user_id]);

    const checkNameChanged = (e) => {
        setIsChanged(nameInputRef.current.value !== serverData.name);
    };

    const imgChanged = (e) => {
        if (e.target.files.lenght !== 0) {
            setNewServerImg(URL.createObjectURL(e.target.files[0]));
            setIsChanged(true);
        }
    };

    const updateChanged = async () => {
        let url;
        if (imgInputRef.current.files.length !== 0) {
            let fileItem = await imgInputRef.current.files[0];
            let storageRef = ref(storage, `serverStorage/${serverSelect}/serverProfileImg`);
            try {
                await deleteObject(storageRef);
            } catch (error) {
                console.log(error);
            }
            let uploadResult = await uploadBytes(storageRef, fileItem);
            url = await getDownloadURL(uploadResult.ref);
        }
        try {
            const { data } = await axiosInstance.put('/api/server/updateServer', {
                idToken: userToken,
                serverId: serverSelect,
                newServerName: nameInputRef.current.value.trim(),
                newServerImg: url,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Server profile successfuly !' }));
            setIsChanged(false);
        } catch (error) {
            console.log(error);
        }
    };

    const updateRoleOrderChanged = () => {
        console.log(listRoleAfterChange);
        axiosInstance
            .put('/api/server/updateRoleOrder', {
                idToken: userToken,
                serverId: serverSelect,
                newRoleList: listRoleAfterChange,
            })
            .then((response) => {
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Role order changed !' }));
                setRoleOrderChange(false);
            });
    };

    function compareObjects(obj1, obj2) {
        // So sánh các thuộc tính của đối tượng
        return obj1.id === obj2.id && obj1.name === obj2.name;
    }

    const compareIndexChanged = (list1, list2) => {
        if (list1.length !== list2.length) {
            return true; // Kiểm tra độ dài của danh sách trước khi so sánh
        }

        for (let i = 0; i < list1.length; i++) {
            if (!compareObjects(list1[i], list2[i])) {
                return true; // Nếu có bất kỳ đối tượng nào không giống nhau, trả về false
            }
        }

        return false; // Nếu tất cả các đối tượng đều giống nhau, trả về true
    };

    function handleOnDragEnd(result) {
        if (!result.destination) return;
        const items = Array.from(listRoleAfterChange);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setListRoleAfterChange(items);

        setRoleOrderChange(compareIndexChanged(items, listRole));
        // console.log(compareIndexChanged(items, listRole));
        // console.log(items);
        // console.log(listRole);
    }

    const removeBanItem = (item) => {
        let tempArr = [...listBan];
        tempArr = tempArr.filter((item) => item !== item);
        setListBan(tempArr);
    };

    return (
        <>
            <div className="serverModal_main">
                <div className="serverModal_box">
                    <div className="serverModal_box_close">
                        <h1>Server Setting</h1>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                    </div>
                    <div className="serverSetting_modal_nav">
                        {isHaveAdminPermission === true || serverOwner === user.user_id ? (
                            <button
                                onClick={() => setNavPos(navArr.general)}
                                className={navPos === navArr.general ? 'selected' : ''}
                            >
                                General
                            </button>
                        ) : null}
                        {haveManageRolePerm === true || isHaveAdminPermission === true || serverOwner === user.user_id ? (
                            <button onClick={() => setNavPos(navArr.roles)} className={navPos === navArr.roles ? 'selected' : ''}>
                                Roles
                            </button>
                        ) : null}
                        <button onClick={() => setNavPos(navArr.users)} className={navPos === navArr.users ? 'selected' : ''}>
                            Users
                        </button>
                        {haveManageRolePerm === true || isHaveAdminPermission === true || serverOwner === user.user_id ? (
                            <button
                                onClick={() => setNavPos(navArr.banList)}
                                className={navPos === navArr.banList ? 'selected' : ''}
                            >
                                Ban List
                            </button>
                        ) : null}
                    </div>
                    {navPos === navArr.general ? (
                        <div className="serverModal_box_input">
                            <input
                                onChange={imgChanged}
                                ref={imgInputRef}
                                style={{ display: 'none' }}
                                type="file"
                                accept=".jpg, .jpeg, .png, .gif"
                            />
                            <img
                                onClick={() => imgInputRef.current.click()}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    alignSelf: 'center',
                                    cursor: 'pointer',
                                    margin: '10px',
                                }}
                                src={isChanged ? (newServerImg ? newServerImg : serverData?.img) : serverData?.img}
                            ></img>
                            <input
                                onChange={(e) => checkNameChanged(e)}
                                type="text"
                                placeholder="New server name"
                                ref={nameInputRef}
                            ></input>
                        </div>
                    ) : navPos === navArr.roles ? (
                        <div className="serverModal_box_input">
                            <buton className="add_role_btn" onClick={() => setAddRoleModal(true)}>
                                Add role
                            </buton>
                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="roles">
                                    {(provided) => (
                                        <ul
                                            style={{ listStyle: 'none', padding: '0', margin: '0' }}
                                            className="roles_container"
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {listRoleAfterChange.map((role, index) => {
                                                if (role.id !== '0') {
                                                    return (
                                                        <Draggable key={role.id} draggableId={role.id} index={index}>
                                                            {(provided) => (
                                                                <li
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    ref={provided.innerRef}
                                                                >
                                                                    <RoleItem roleId={role.id} />
                                                                </li>
                                                            )}
                                                        </Draggable>
                                                    );
                                                }
                                                return (
                                                    <li key={role.id}>
                                                        <RoleItem roleId={role.id} />
                                                    </li>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    ) : navPos === navArr.users ? (
                        <div className="serverModal_box_input">
                            <input style={{ marginTop: '10px' }} placeholder="Search User" type="text" spellCheck={false}></input>
                            <div className="roles_container">
                                {listMember?.map((member, index) => {
                                    return (
                                        <>
                                            <UserItem
                                                haveManageRolePerm={
                                                    haveManageRolePerm === true ||
                                                    isHaveAdminPermission === true ||
                                                    serverOwner === user.user_id
                                                }
                                                key={member}
                                                memberId={member}
                                                banType={false}
                                            />
                                        </>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="serverModal_box_input">
                            <input style={{ marginTop: '10px' }} placeholder="Search User" type="text" spellCheck={false}></input>
                            <div className="roles_container">
                                {listBan?.map((member, index) => {
                                    return (
                                        <>
                                            <UserItem
                                                haveManageRolePerm={
                                                    haveManageRolePerm === true ||
                                                    isHaveAdminPermission === true ||
                                                    serverOwner === user.user_id
                                                }
                                                key={member}
                                                memberId={member}
                                                banType={true}
                                                removeBanItem={() => removeBanItem(member)}
                                            />
                                        </>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="serverModal_box_actBtn">
                        {isChanged ? (
                            <button onClick={updateChanged} style={{ backgroundColor: 'green' }}>
                                Save
                            </button>
                        ) : null}
                        {roleOrderChange ? (
                            <button onClick={updateRoleOrderChanged} style={{ backgroundColor: 'green' }}>
                                Save
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            {addRoleModal ? <AddRoleModal closeModal={() => setAddRoleModal(false)} /> : null}
        </>
    );
}

export default ServerSettingModal;
