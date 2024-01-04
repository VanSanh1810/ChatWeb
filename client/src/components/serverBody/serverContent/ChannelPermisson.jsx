import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import app from '../../../configs/firebase';
import { useSelector } from 'react-redux';
import ChannelPermList from './ChannelPermList';
import axiosInstance from '../../../configs/axiosConfig';
import { useDispatch } from 'react-redux';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';

function ChannelPermisson(props) {
    const dispatch = useDispatch();

    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const [isHaveChanged, setIsHaveChanged] = useState(false);
    const [currentSelected, setCurrentSelected] = useState({ id: '0', type: 'role' });
    const [listRoleAccess, setListRoleAccess] = useState([]);
    const [listMemAccess, setListMemAccess] = useState([]);

    useEffect(() => {
        const channelDocRef = doc(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId);

        const unSub = onSnapshot(collection(channelDocRef, 'roles'), (roleSnapshot) => {
            let tempList = [];
            Promise.all(
                roleSnapshot.docs.map(async (role, index) => {
                    tempList.push({ id: role.id, type: 'role' });
                    return index;
                }),
            ).then(() => {
                setListRoleAccess(tempList);
            });
        });
        const unSub2 = onSnapshot(collection(channelDocRef, 'members'), (memberSnapshot) => {
            let tempList = [];
            Promise.all(
                memberSnapshot.docs.map(async (member, index) => {
                    tempList.push({ id: member.id, type: 'member' });
                    return index;
                }),
            ).then(() => {
                setListMemAccess(tempList);
            });
        });

        return () => {
            unSub();
            unSub2();
        };
    }, [props.channelId, serverSelect]);

    const setSelectedItm = (id, type) => {
        setCurrentSelected({ id: id, type: type });
    };

    const savePermChange = () => {
        axiosInstance
            .put('api/server/updateChannelPerm', {
                idToken: userToken,
                channelId: props.channelId,
                serverId: serverSelect,
                selectedPerm: currentSelected,
                perms: isHaveChanged,
            })
            .then((response) => {
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Channel permission updated !' }));
                props.closeModal();
            });
    };

    return (
        <>
            <div className="serverModal_box_input">
                <label style={{ marginBottom: '10px', marginTop: '10px' }}>Channel permission</label>
                <div className="channel_perm_container">
                    <div className="channel_perm_selector">
                        {listRoleAccess.map((roleAccess) => {
                            return (
                                <AccessItem
                                    key={roleAccess.id}
                                    setSelected={setSelectedItm}
                                    selected={currentSelected}
                                    data={roleAccess}
                                />
                            );
                        })}
                        {listMemAccess.map((memAccess) => {
                            return (
                                <AccessItem
                                    key={memAccess.id}
                                    setSelected={setSelectedItm}
                                    selected={currentSelected}
                                    data={memAccess}
                                />
                            );
                        })}
                    </div>
                    <div className="channel_perm_content">
                        {currentSelected ? (
                            <ChannelPermList
                                permData={currentSelected}
                                channelId={props.channelId}
                                setHaveChange={setIsHaveChanged}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="serverModal_box_actBtn">
                {isHaveChanged ? (
                    <button style={{ backgroundColor: 'green' }} onClick={savePermChange}>
                        Save
                    </button>
                ) : null}
            </div>
        </>
    );
}

export default ChannelPermisson;

function AccessItem(props) {
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [accessItemData, setAccessItemData] = useState({});
    useEffect(() => {
        if (props.data.type === 'role') {
            const roleRef = doc(getFirestore(app), 'servers', serverSelect, 'roles', props.data.id);
            getDoc(roleRef).then((role) => {
                setAccessItemData({
                    id: role.id,
                    name: role.data().roleName,
                    img: `https://place-hold.it/300x300/${role.data().color.slice(1)}/${role.data().color.slice(1)}`,
                    type: 'role',
                });
            });
        } else {
            const memRef = doc(getFirestore(app), 'users', props.data.id);
            getDoc(memRef).then((mem) => {
                setAccessItemData({
                    id: mem.id,
                    name: mem.data().name,
                    img: mem.data().img,
                    type: 'member',
                });
            });
        }
    }, [serverSelect, props]);
    return (
        <div
            onClick={() => props.setSelected(accessItemData.id, accessItemData.type)}
            className={props.selected.id === accessItemData.id ? 'accItm selected' : 'accItm'}
        >
            <img src={accessItemData.img}></img>
            <span>{accessItemData.name}</span>
        </div>
    );
}
