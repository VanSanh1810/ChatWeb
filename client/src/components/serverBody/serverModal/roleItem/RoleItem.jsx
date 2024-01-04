import React, { useEffect, useState } from 'react';
import './roleItem.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import app from '../../../../configs/firebase';
import { useSelector } from 'react-redux';
import ConfirmModal from '../../serverList/ConfirmModal';
import MangeRoleUserModal from './MangeRoleUserModal';

function RoleItem(props) {
    const storage = getStorage(app);
    const [roleData, setRoleData] = useState();
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const [roleSettingOpen, setRoleSettingOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);
    const [roleUserModal, setRoleUserModal] = useState(false);
    useEffect(() => {
        const roleDocRef = doc(getFirestore(app), 'servers', serverSelect, 'roles', props.roleId);
        const unSub = onSnapshot(roleDocRef, async (querySnapshot) => {
            setRoleData({
                roleId: querySnapshot.id,
                data: querySnapshot.data(),
            });
        });
        return () => {
            unSub();
        };
    }, []);

    return (
        <>
            <div className="main_role_item" style={{ backgroundColor: roleData?.data.color }}>
                <FontAwesomeIcon style={{ marginRight: '10px', cursor: 'pointer' }} icon="fa-solid fa-ellipsis-vertical" />
                <h3 style={{ flexGrow: '2' }}>{roleData?.data.roleName}</h3>
                {roleData?.roleId === '0' ? null : (
                    <h3 style={{ marginRight: '25px' }}>
                        <FontAwesomeIcon icon="fa-solid fa-user" /> {roleData?.data.members.length}
                    </h3>
                )}
                <div>
                    <button onClick={() => setRoleSettingOpen(!roleSettingOpen)}>
                        <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
                    </button>
                    <div style={roleSettingOpen ? null : { display: 'none' }} className="main_role_setting_box">
                        <button
                            onClick={() => {
                                setRoleUserModal(true);
                                setRoleSettingOpen(false);
                            }}
                        >
                            Manage
                        </button>
                        {roleData?.data.addable ? (
                            <button
                                onClick={() => {
                                    setConfirmModal(true);
                                    setRoleSettingOpen(false);
                                }}
                            >
                                Delete role
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            {confirmModal ? <ConfirmModal roleData={roleData} closeModal={() => setConfirmModal(false)} /> : null}
            {roleUserModal ? <MangeRoleUserModal roleData={roleData} closeModal={() => setRoleUserModal(false)} /> : null}
        </>
    );
}

export default RoleItem;
