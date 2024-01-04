import React, { useState } from 'react';
import ServerList from './serverList/ServerList';
import './serverBody.css';
import ServerCreateModal from './serverModal/serverCreateModal/ServerCreateModal';
import ServerContent from './serverContent/ServerContent';
import { useSelector } from 'react-redux';
import RoomContent from './roomContent/RoomContent';

function ServerBody(props) {
    const [openCreateServerModal, setOpenCreateServerModal] = useState(false);
    const { serverSelect, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    return (
        <div className="main__serverbody">
            <ServerList toggleCreateServerModal={setOpenCreateServerModal} />
            {serverSelect ? <ServerContent /> : null}
            {roomSelect.roomId ? <RoomContent roomId={roomSelect.roomId} roomType={roomSelect.roomType} /> : null}
            {openCreateServerModal ? <ServerCreateModal closeModal={setOpenCreateServerModal} /> : null}
        </div>
    );
}

export default ServerBody;
