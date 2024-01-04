import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import './moveRoomModal.css';
import { useDispatch, useSelector } from 'react-redux';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';
import axiosInstance from '../../../../configs/axiosConfig';

function MoveRoomModal(props) {
    const dispatch = useDispatch();

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const [listChannel, setListChannel] = useState([]);
    const [channelToMoveTo, setChannelToMoveTo] = useState();

    useEffect(() => {
        const channelColRef = collection(getFirestore(app), 'servers', serverSelect, 'chanels');
        getDocs(channelColRef).then((results) => {
            let tempList = [];
            Promise.all(
                results.docs.map((doc, index) => {
                    if (doc.id !== props.channelId) {
                        if (doc.id !== '0') {
                            tempList.push({ id: doc.id, name: doc.data().chanelName, checked: false });
                        } else {
                            tempList.push({ id: doc.id, name: 'No channel', checked: false });
                        }
                    }
                    return index;
                }),
            ).then(() => {
                setListChannel(tempList);
            });
        });
    }, []);

    const selectChannel = (id) => {
        let tempList = [...listChannel];
        Promise.all(
            tempList.map((channel, index) => {
                if (channel.id !== id) {
                    return { id: channel.id, name: channel.name, checked: false };
                } else {
                    return { id: channel.id, name: channel.name, checked: true };
                }
            }),
        ).then((result) => {
            setChannelToMoveTo(id);
            setListChannel(result);
        });
    };

    const moveRoom = () => {
        if (channelToMoveTo) {
            axiosInstance
                .put('api/server/moveRoom', {
                    idToken: userToken,
                    serverId: serverSelect,
                    currentChannel: props.channelId,
                    targetChannelId: channelToMoveTo,
                    roomId: props.roomData.roomId,
                })
                .then(() => {
                    props.closeModal();
                });
        }
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>Move room</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                <div className="serverModal_box_input">
                    <label>Select channel to move to</label>
                    <div className="list_channel_to_move_to">
                        {listChannel.map((channel, index) => {
                            return (
                                <div
                                    key={channel.id}
                                    onClick={() => selectChannel(channel.id)}
                                    className="list_channel_to_move_to_item"
                                >
                                    <input type="radio" checked={channel.checked}></input>
                                    <span>{channel.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="serverModal_box_actBtn">
                    {channelToMoveTo ? (
                        <button style={{ backgroundColor: 'green' }} onClick={moveRoom}>
                            Move
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

export default MoveRoomModal;
