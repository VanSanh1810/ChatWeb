import React, { useEffect, useState } from 'react';
import './serverList.css';
import ServerListItem from './ServerListItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useSelector } from 'react-redux';

function ServerList(props) {
    const [serverListItems, setServerListItems] = useState([]);
    const { user } = useSelector((state) => state.persistedReducer.authReducer);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', user.user_id);
        const unsub = onSnapshot(collection(userDocRef, 'servers'), async (querySnapshot) => {
            let listServer = [];
            await Promise.all(
                querySnapshot.docs.map(async (doc, index) => {
                    let tempServerImg = await doc.data().serverImg;
                    const tempData = {
                        serverId: doc.id,
                        serverImg: tempServerImg + '?temp=' + Date.now(),
                    };
                    listServer.push(tempData);
                    return index;
                }),
            );
            setServerListItems(listServer);
        });
        return () => {
            unsub();
        };
    }, [user]);

    return (
        <div className="server_list_main_container">
            <div className="server_list_item_plus" onClick={() => props.toggleCreateServerModal(true)}>
                <i>
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                </i>
            </div>
            <div className="server_list_main">
                {serverListItems.map((item, index) => {
                    return <ServerListItem key={item.serverId} serverData={item} />;
                })}
            </div>
        </div>
    );
}

export default ServerList;
