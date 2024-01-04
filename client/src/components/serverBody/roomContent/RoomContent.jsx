import React, { useEffect, useState } from 'react';
import './roomContent.css';
import TextRoomContent from './TextRoomContent';
import VoiceRoomContent from './VoiceRoomContent';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useSelector } from 'react-redux';

function RoomContent(props) {
    const [roomName, setRoomName] = useState();
    const { serverSelect, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    useEffect(() => {
        const roomDocRef = doc(
            getFirestore(app),
            'servers',
            serverSelect,
            'chanels',
            roomSelect.channelId,
            'rooms',
            roomSelect.roomId,
        );
        const unSub = onSnapshot(roomDocRef, async (querySnapshot) => {
            setRoomName(await querySnapshot.data().roomName);
        });
        return () => {
            unSub();
        };
    }, [roomSelect, serverSelect]);

    return (
        <div className="room_content_main">
            <div className="room_content_title">
                {props.roomType === 'text' ? (
                    <FontAwesomeIcon icon="fa-solid fa-hashtag" />
                ) : (
                    <FontAwesomeIcon icon="fa-solid fa-volume-high" />
                )}
                {roomName ? roomName : ''}
            </div>
            {props.roomType === 'text' ? <TextRoomContent /> : <VoiceRoomContent />}
        </div>
    );
}

export default RoomContent;
