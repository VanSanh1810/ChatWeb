import React, { useEffect, useRef, useState } from 'react';
import './serverCreateRoomModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../../../configs/axiosConfig';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ServerCreateRoomModal(props) {
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const dispatch = useDispatch();
    const room = {
        text: 0,
        voice: 1,
    };
    const [roomType, setRoomType] = useState(room.text);

    const roomNameRef = useRef();
    const [roomName, setRoomName] = useState();

    useEffect(() => {}, []);

    const createNewRoom = () => {
        try {
            axiosInstance.put('api/server/createRoom', {
                idToken: userToken,
                channelId: props.channelId ? props.channelId : null,
                serverId: serverSelect,
                roomName: roomNameRef.current.value,
                roomType: roomType,
            });
            dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Room created !' }));
            props.closeModal();
        } catch (error) {
            console.log(error);
        }
    };

    const checkRoomName = () => {
        setRoomName(roomNameRef.current.value.trim());
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Create new Room</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <label>Room type</label>
                    <div
                        className={roomType === room.text ? 'room_type_radio_item selected' : 'room_type_radio_item'}
                        onClick={() => setRoomType(room.text)}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-hashtag" />
                        <div className="room_type_radio_item_info">
                            <p>Text</p>
                            <p>Chat with other user, send image and video</p>
                        </div>
                        <input type="radio" checked={roomType === room.text}></input>
                    </div>
                    <div
                        className={roomType === room.voice ? 'room_type_radio_item selected' : 'room_type_radio_item'}
                        onClick={() => setRoomType(room.voice)}
                    >
                        <FontAwesomeIcon icon="fa-solid fa-volume-high" />
                        <div className="room_type_radio_item_info">
                            <p>Voice</p>
                            <p>Call video with your friend, share screen</p>
                        </div>
                        <input type="radio" checked={roomType === room.voice}></input>
                    </div>
                    <label>Room Name</label>
                    <input
                        ref={roomNameRef}
                        type="text"
                        spellCheck="false"
                        placeholder="Enter new room name"
                        onChange={checkRoomName}
                    ></input>
                </div>
                <div className="serverModal_box_actBtn">
                    <button onClick={() => props.closeModal()}>Close</button>
                    {roomName ? <button onClick={createNewRoom}>Create</button> : null}
                </div>
            </div>
        </div>
    );
}

export default ServerCreateRoomModal;
