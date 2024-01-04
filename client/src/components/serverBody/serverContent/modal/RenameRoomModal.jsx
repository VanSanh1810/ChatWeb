import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, useState } from 'react';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function RenameRoomModal(props) {
    // channelId: props.channelId,
    // roomId: room.id,
    // roomName: room.name,

    const dispatch = useDispatch();

    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const [roomName, setRoomName] = useState(props.roomData.roomName);
    const [haveChange, setHaveChange] = useState(false);
    const inputRef = useRef();

    const checkRoomName = () => {
        setHaveChange(roomName !== inputRef.current.value.trim());
    };

    const renameRoom = async () => {
        try {
            await axiosInstance.put('api/server/renameRoom', {
                idToken: userToken,
                channelId: props.roomData.channelId ? props.roomData.channelId : null,
                serverId: serverSelect,
                roomId: props.roomData.roomId,
                roomName: inputRef.current.value.trim(),
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Room name changed !' }));
            props.closeModal();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Rename room</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <label>New room name</label>
                    <input
                        ref={inputRef}
                        type="text"
                        spellCheck="false"
                        placeholder="Enter new room name"
                        onChange={checkRoomName}
                        defaultValue={props.roomData.roomName}
                    ></input>
                </div>
                <div className="serverModal_box_actBtn">
                    {haveChange ? (
                        <button style={{ backgroundColor: 'green' }} onClick={renameRoom}>
                            Change
                        </button>
                    ) : null}
                    <button onClick={() => props.closeModal()} style={{ backgroundColor: '#a1a1a1' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RenameRoomModal;
