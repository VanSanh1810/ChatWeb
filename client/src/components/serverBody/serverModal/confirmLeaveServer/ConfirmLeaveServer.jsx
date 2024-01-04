import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setServerSelect } from '../../../../store/reducers/serverReducer';

function ConfirmLeaveServer(props) {
    const dispatch = useDispatch();

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const leaveServer = () => {
        axiosInstance
            .put('api/server/leaveServer', {
                idToken: userToken,
                serverId: serverSelect,
            })
            .then(() => {
                dispatch(setServerSelect(null));
                props.closeModal();
            });
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Leaving server</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <p style={{ fontFamily: "'Roboto', sans-serif" }}>
                        Are you sure you want to leave the server. This action cannot be undo
                    </p>
                </div>
                <div className="serverModal_box_actBtn">
                    <button style={{ backgroundColor: 'red' }} onClick={leaveServer}>
                        Leave
                    </button>
                    <button onClick={() => props.closeModal()} style={{ backgroundColor: '#a1a1a1' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmLeaveServer;
