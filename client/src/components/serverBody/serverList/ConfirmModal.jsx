import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';

function ConfirmModal(props) {
    const dispatch = useDispatch();
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const deleteRoleAction = async () => {
        try {
            const { data } = await axiosInstance.put('/api/server/deleteRole', {
                idToken: userToken,
                roleId: props.roleData.roleId,
                serverId: serverSelect,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Role deleted !' }));
            props.closeModal();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Delete role</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <p>Are you sure you want to delete {props.roleData.data.roleName} role. This action can not be undo !</p>
                </div>
                <div className="serverModal_box_actBtn">
                    <button onClick={() => props.closeModal()}>Close</button>
                    <button style={{ backgroundColor: 'red' }} onClick={deleteRoleAction}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
