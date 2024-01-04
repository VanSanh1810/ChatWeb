import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useDispatch, useSelector } from 'react-redux';
import ChannelSettingModal from './ChannelSettingModal';
import ServerCreateRoomModal from '../serverModal/serverCreateRoomModal/ServerCreateRoomModal';
import { setRoomSelect } from '../../../store/reducers/serverReducer';
import RenameRoomModal from './modal/RenameRoomModal';
import DeleteRoomModal from './modal/DeleteRoomModal';
import MoveRoomModal from './modal/MoveRoomModal';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';

function ChanelFragment(props) {
    const dispatch = useDispatch();

    const { serverSelect, serverOwner, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { user } = useSelector((state) => state.persistedReducer.authReducer);

    const [isOpen, setIsOpen] = useState(false);
    const [isNoChannel, setIsNoChannel] = useState(false);
    const [channelInfo, setChannelInfo] = useState();
    const [channelId, setChannelId] = useState();
    const [channelSettingModal, setChannelSettingModal] = useState(false);
    const [channelCreateRoomModal, setChannelCreateRoomModal] = useState(false);
    const [changeRoomNameModal, setChangeRoomNameModal] = useState(false);
    const [deleteRoomModal, setDeleteRoomModal] = useState(false);
    const [moveRoomModal, setMoveRoomModal] = useState(false);

    const [roomListData, setRoomListData] = useState([]);

    const [menuVisible, setMenuVisible] = useState(false);
    const [position, setPosition] = useState({ left: 0, top: 0 });
    const handleContextMenu = (e) => {
        if (props.manageRooms === true) {
            e.preventDefault();
            setMenuVisible(true);
            setPosition({ left: e.clientX, top: e.clientY });
        }
    };

    const hideMenu = () => {
        setMenuVisible(false);
    };

    useEffect(() => {
        const channelDocRef = doc(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId);
        const unsubscribeDoc = onSnapshot(channelDocRef, async (querySnapshot) => {
            if (querySnapshot.id === '0') {
                setIsNoChannel(true);
                setIsOpen(true);
            }
            setChannelId(querySnapshot.id);
            setChannelInfo(querySnapshot.data());
        });
        const channelRoomColRef = collection(getFirestore(app), 'servers', serverSelect, 'chanels', props.channelId, 'rooms');
        const unsubscribeDoc2 = onSnapshot(channelRoomColRef, async (querySnapshot) => {
            let tempList = [];
            await Promise.all(
                querySnapshot.docs.map(async (room) => {
                    if ((await room.data().roomType) === 'text') {
                        if (props.chatEnable === true) {
                            tempList.push({
                                id: room.id,
                                name: await room.data().roomName,
                                type: await room.data().roomType,
                            });
                        }
                    } else {
                        if (props.voiceEnable === true) {
                            tempList.push({
                                id: room.id,
                                name: await room.data().roomName,
                                type: await room.data().roomType,
                            });
                        }
                    }
                }),
            );
            setRoomListData(tempList);
        });
        return () => {
            unsubscribeDoc();
            unsubscribeDoc2();
        };
    }, [props.channelId, serverSelect, props.chatEnable, props.voiceEnable]);

    return (
        <>
            <div className="channel_frag_items">
                {isNoChannel ? null : (
                    <div className="channel_frag_items_channelName">
                        <i onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? (
                                <FontAwesomeIcon icon="fa-solid fa-chevron-down" />
                            ) : (
                                <FontAwesomeIcon icon="fa-solid fa-angle-right" />
                            )}
                        </i>
                        <p onClick={() => setIsOpen(!isOpen)}>{channelInfo?.chanelName}</p>
                        {props.manageRooms === true ? (
                            <>
                                <i onClick={() => setChannelSettingModal(true)} style={{ marginRight: '5px' }}>
                                    <FontAwesomeIcon icon="fa-solid fa-gear" />
                                </i>
                                <i onClick={() => setChannelCreateRoomModal(true)}>
                                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                                </i>
                            </>
                        ) : null}
                    </div>
                )}
                <div style={isOpen ? null : { display: 'none' }} className="channel_frag_items_listRoom">
                    {roomListData.map((room) => {
                        return (
                            <div
                                key={room.id}
                                className="channel_frag_items_listRoom_item"
                                onClick={() => {
                                    if (roomSelect.roomType !== 'voice') {
                                        dispatch(
                                            setRoomSelect({ channelId: props.channelId, roomId: room.id, roomType: room.type }),
                                        );
                                    } else {
                                        dispatch(
                                            setToastState({
                                                Tstate: toastType.error,
                                                Tmessage: 'Please leave current voice room !',
                                            }),
                                        );
                                    }
                                }}
                                onContextMenu={handleContextMenu}
                            >
                                {room.type === 'text' ? (
                                    <FontAwesomeIcon icon="fa-solid fa-hashtag" />
                                ) : (
                                    <FontAwesomeIcon icon="fa-solid fa-volume-low" />
                                )}
                                <h5>{room.name}</h5>
                                {menuVisible ? (
                                    <div
                                        className="roomm_context_container"
                                        style={{
                                            position: 'absolute',
                                            left: position.left,
                                            top: position.top,
                                            background: 'white',
                                            padding: '5px',
                                        }}
                                    >
                                        <button
                                            onClick={() => {
                                                hideMenu();
                                                setChangeRoomNameModal({
                                                    channelId: props.channelId,
                                                    roomId: room.id,
                                                    roomName: room.name,
                                                });
                                            }}
                                        >
                                            Rename
                                        </button>
                                        <button
                                            onClick={() => {
                                                hideMenu();
                                                setMoveRoomModal({
                                                    channelId: props.channelId,
                                                    roomId: room.id,
                                                });
                                            }}
                                        >
                                            Move to
                                        </button>
                                        <button
                                            onClick={() => {
                                                hideMenu();
                                                setDeleteRoomModal({
                                                    channelId: props.channelId,
                                                    roomId: room.id,
                                                });
                                            }}
                                        >
                                            Delete
                                        </button>
                                        <button onClick={hideMenu}>Close</button>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
            {channelSettingModal ? (
                <ChannelSettingModal channelId={channelId} closeModal={() => setChannelSettingModal(false)} />
            ) : null}
            {channelCreateRoomModal ? (
                <ServerCreateRoomModal channelId={channelId} closeModal={() => setChannelCreateRoomModal(false)} />
            ) : null}
            {changeRoomNameModal ? (
                <RenameRoomModal
                    roomData={changeRoomNameModal}
                    channelId={channelId}
                    closeModal={() => setChangeRoomNameModal(false)}
                />
            ) : null}
            {deleteRoomModal ? (
                <DeleteRoomModal roomData={deleteRoomModal} channelId={channelId} closeModal={() => setDeleteRoomModal(false)} />
            ) : null}
            {moveRoomModal ? (
                <MoveRoomModal roomData={moveRoomModal} channelId={channelId} closeModal={() => setMoveRoomModal(false)} />
            ) : null}
        </>
    );
}

export default ChanelFragment;
