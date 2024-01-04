import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ConfirmDeleteUserModal(props) {
    const dispatch = useDispatch();
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const deleteUserRoleAction = async () => {
        try {
            const { data } = await axiosInstance.post('/api/server/deleteUserRole', {
                idToken: userToken,
                roleName: props.targetRole,
                targetUser: props.uidToDel,
                serverId: serverSelect,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'User removed from role successfuly !' }));
        } catch (err) {
            console.log(err);
        }
    };
    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Remove user from role</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <p>Are you sure you want to remove this user. This action can not be undo !</p>
                </div>
                <div className="serverModal_box_actBtn">
                    <button onClick={() => props.closeModal()}>Close</button>
                    <button style={{ backgroundColor: 'red' }} onClick={deleteUserRoleAction}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDeleteUserModal;
