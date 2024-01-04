import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ConfirmDeleteChannel(props) {
    const dispatch = useDispatch();

    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const deleteChannel = async () => {
        await axiosInstance.put('api/server/deleteChannel', {
            idToken: userToken,
            channelId: props.channelId,
            serverId: serverSelect,
        });
        dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Channel deleted !' }));
        props.closeModal();
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Delete channel</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <p style={{ fontFamily: "'Roboto', sans-serif" }}>
                        Are you sure you want to delete this. This action cannot be undo and all the room in this channel will be
                        move to public channel.
                    </p>
                </div>
                <div className="serverModal_box_actBtn">
                    <button style={{ backgroundColor: 'red' }} onClick={deleteChannel}>
                        Delete
                    </button>
                    <button onClick={() => props.closeModal()} style={{ backgroundColor: '#a1a1a1' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDeleteChannel;
