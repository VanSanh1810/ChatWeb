import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import app from '../../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function RoleToSelect(props) {
    const dispatch = useDispatch();
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const [listRoles, setListRoles] = useState([]);

    const addRoleToUser = async (roleId) => {
        let role = listRoles.find((role) => {
            return role.roleId === roleId;
        });
        if (!role.checked) {
            try {
                const { data } = await axiosInstance.put('/api/server/addUserToRole', {
                    idToken: userToken,
                    roleId: roleId,
                    roleUser: [props.memberId],
                    serverId: serverSelect,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Add user to role successfuly !' }));
                setListRoles(
                    listRoles.map((role) => {
                        if (role.roleId === roleId) {
                            return {
                                roleId: role.roleId,
                                roleName: role.roleName,
                                checked: true,
                            };
                        }
                    }),
                );
            } catch (err) {
                console.log(err);
            }
        } else {
            try {
                const { data } = await axiosInstance.put('/api/server/removeUserFromRole', {
                    idToken: userToken,
                    roleId: roleId,
                    roleUser: [props.memberId],
                    serverId: serverSelect,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Remove user froom role successfuly !' }));
                setListRoles(
                    listRoles.map((role) => {
                        if (role.roleId === roleId) {
                            return {
                                roleId: role.roleId,
                                roleName: role.roleName,
                                checked: false,
                            };
                        }
                    }),
                );
            } catch (err) {
                console.log(err);
            }
        }
    };

    useEffect(() => {
        const serverDocRef = doc(getFirestore(app), 'servers', serverSelect);
        const memberDocRef = doc(serverDocRef, 'members', props.memberId);
        const roleColRef = collection(serverDocRef, 'roles');
        const process = () => {
            Promise.all([getDocs(roleColRef), getDoc(memberDocRef)]).then(async (results) => {
                let serverRoles = [];
                let memberRoles = [];
                await Promise.all([
                    results[0].docs.map(async (doc, index) => {
                        if (doc.id !== '0') {
                            serverRoles.push({ roleId: doc.id, roleName: doc.data().roleName });
                        }
                        return index;
                    }),
                ]);
                memberRoles = await results[1].data().roles;
                let resultList = [];
                await Promise.all([
                    serverRoles.map(async (role, index1) => {
                        if (memberRoles.indexOf(role.roleId) >= 0) {
                            resultList.push({
                                roleId: role.roleId,
                                roleName: role.roleName,
                                checked: true,
                            });
                        } else {
                            resultList.push({
                                roleId: role.roleId,
                                roleName: role.roleName,
                                checked: false,
                            });
                        }
                        return index1;
                    }),
                ]);
                setListRoles(resultList);
            });
        };
        process();
    }, [serverSelect, props.memberId]);
    return (
        <div className="role_to_select_user_item">
            {listRoles?.map((role, index) => {
                return (
                    <div key={index} style={{ padding: '10px', margin: '0px 10px' }} className="list_user_include_item">
                        <input
                            checked={role.checked}
                            id={role.roleId}
                            style={{ padding: '0px', marginRight: '10px' }}
                            type="checkbox"
                            onChange={(e) => addRoleToUser(role.roleId)}
                        />
                        <h4 style={{ padding: '0px', margin: '0px' }}>{role.roleName}</h4>
                    </div>
                );
            })}
        </div>
    );
}

export default RoleToSelect;
