import React, { useEffect, useState } from 'react';
import ThreeStateButton from '../../_threeStateBtn/ThreeStateButton';
import { collection, doc, getDocs, getFirestore } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useSelector } from 'react-redux';

function ChannelPermList(props) {
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [listPerm, setListPerm] = useState([]);
    const [newListPerm, setNewListPerm] = useState([]);

    useEffect(() => {
        props.setHaveChange(false);
        const channelDocRef = doc(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId);
        if (props.permData.type === 'role') {
            const roleDocRef = doc(channelDocRef, 'roles', props.permData.id);
            getDocs(collection(roleDocRef, 'channel_role_permissions')).then((rolePerms) => {
                let tempList = [];
                Promise.all(
                    rolePerms.docs.map(async (rolePerm, index) => {
                        tempList[rolePerm.id] = rolePerm.data().enable;
                        return index;
                    }),
                ).then(() => {
                    setListPerm({ ...tempList });
                    setNewListPerm({ ...tempList });
                });
            });
        } else {
            const memDocRef = doc(channelDocRef, 'members', props.permData.id);
            getDocs(collection(memDocRef, 'channel_member_permissions')).then((memPerms) => {
                let tempList = [];
                Promise.all(
                    memPerms.docs.map(async (memPerm, index) => {
                        tempList[memPerm.id] = memPerm.data().enable;
                        return index;
                    }),
                ).then(() => {
                    setListPerm({ ...tempList });
                    setNewListPerm({ ...tempList });
                });
            });
        }
    }, [props.permData.type, props.permData.id, props.channelId, serverSelect]);

    const setNewPermValue = (newVal, permId) => {
        let tempList = { ...newListPerm };
        tempList[permId] = newVal;
        setNewListPerm(tempList);
        if (isEquivalent(listPerm, newListPerm)) {
            props.setHaveChange(tempList);
            console.log(tempList);
        } else {
            props.setHaveChange(false);
        }
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

    return (
        <div className="role_permission_container">
            <h5>General channel permission</h5>
            <div className="role_permission_item">
                <div>
                    <label>View Rooms</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1A0']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1A0')}
                    />
                </div>
                <p>Allow viewing rooms in this channel</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Manage Rooms</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1A1']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1A1')}
                    />
                </div>
                <p>Allows creating, editing and deleting rooms</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Manage Roles</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1A2']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1A2')}
                    />
                </div>
                <p>Manage roles (add, remove role members and edit permissions)</p>
            </div>
            <h5>Text room permission</h5>
            <div className="role_permission_item">
                <div>
                    <label>Send message</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1C0']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1C0')}
                    />
                </div>
                <p>Allow members to send messages in chat</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Send URL</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1C1']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1C1')}
                    />
                </div>
                <p>Allow members to send links in chat</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Send File</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1C2']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1C2')}
                    />
                </div>
                <p>Allow members to send files in chat (not including photos and videos)</p>
            </div>
            <h5>Voice room permission</h5>
            <div className="role_permission_item">
                <div>
                    <label>Connect</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1D0']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1D0')}
                    />
                </div>
                <p>Allows members to connect to the voice room</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Speak</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1D1']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1D1')}
                    />
                </div>
                <p>Allows members to use the mic in the voice room</p>
            </div>
            <div className="role_permission_item">
                <div>
                    <label>Video</label>
                    <ThreeStateButton
                        defautValue={newListPerm['1D2']}
                        changeValue={(newValue) => setNewPermValue(newValue, '1D2')}
                    />
                </div>
                <p>Allow members to use the camera in a voice channel (including screen sharing)</p>
            </div>
        </div>
    );
}

export default ChannelPermList;
