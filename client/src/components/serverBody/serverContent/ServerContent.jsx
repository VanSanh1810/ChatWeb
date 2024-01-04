import { useEffect, useState } from 'react';
import './serverContent.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ChanelFragment from './chanelFragment';
import { collection, doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useSelector } from 'react-redux';
import ServerCreateChannelModal from '../serverModal/serverCreateChannelModal/ServerCreateChannelModal';
import ServerSettingModal from '../serverModal/serverSettingModal/ServerSettingModal';
import ServerInviteModal from '../serverModal/serverInviteModal/ServerInviteModal';
import ServerCreateRoomModal from '../serverModal/serverCreateRoomModal/ServerCreateRoomModal';
import ConfirmLeaveServer from '../serverModal/confirmLeaveServer/ConfirmLeaveServer';
import axiosInstance from '../../../configs/axiosConfig';

function ServerContent(props) {
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect, serverOwner, isHaveAdminPermission } = useSelector((state) => state.persistedReducer.serverReducer);

    const [uData, setUData] = useState();
    const [serverInfo, setServerInfo] = useState();
    const [listChannel, setListChannel] = useState([]);
    const [optOpen, setOptOpen] = useState(false);

    const [owned, setOwned] = useState(false);
    const [haveManageRoomsPerm, setHaveManageRoomsPerm] = useState(false);
    const [haveInvitePerm, setHaveInvitePerm] = useState(false);

    const [createChannelModal, setCreateChannelModal] = useState(false);
    const [createRoomModal, setCreateRoomModal] = useState(null); // no channel room => '' ; channel room => channel id
    const [serverSettingModal, setServerSettingModal] = useState(false);
    const [serverInviteModal, setServerInviteModal] = useState(false);
    const [leaveServerModal, setLeaveServerModal] = useState(false);

    useEffect(() => {
        if (serverSelect) {
            const serverDocRef = doc(getFirestore(app), 'servers', serverSelect);
            const unsubscribe = onSnapshot(collection(serverDocRef, 'chanels'), async (querySnapShot) => {
                if (serverOwner === user.user_id || isHaveAdminPermission === true) {
                    let tempListChannel = [];
                    Promise.all(
                        querySnapShot.docs.map(async (doc, index) => {
                            tempListChannel.push({
                                id: doc.id,
                                chat: true,
                                connect: true,
                                manageRooms: true,
                            });
                            return index;
                        }),
                    ).then(() => {
                        setListChannel(tempListChannel);
                    });
                } else {
                    let tempListChannel = [];
                    Promise.all(
                        querySnapShot.docs.map(async (doc, index) => {
                            if (doc.id === '0') {
                                tempListChannel.push({
                                    id: doc.id,
                                    chat: true,
                                    connect: true,
                                    manageRooms: false,
                                });
                            } else {
                                try {
                                    const response = await axiosInstance.post('/api/permission/checkChannelPerm', {
                                        idToken: userToken,
                                        serverId: serverSelect,
                                        channelId: doc.id,
                                        permId: 'A0',
                                        stackTypeFlags: false,
                                    });
                                    if (response.data.enable) {
                                        const res2 = await Promise.all([
                                            await axiosInstance.post('/api/permission/checkChannelPerm', {
                                                idToken: userToken,
                                                serverId: serverSelect,
                                                channelId: doc.id,
                                                permId: 'C0',
                                                stackTypeFlags: false,
                                            }),
                                            await axiosInstance.post('/api/permission/checkChannelPerm', {
                                                idToken: userToken,
                                                serverId: serverSelect,
                                                channelId: doc.id,
                                                permId: 'D0',
                                                stackTypeFlags: false,
                                            }),
                                            await axiosInstance.post('/api/permission/checkChannelPerm', {
                                                idToken: userToken,
                                                serverId: serverSelect,
                                                channelId: doc.id,
                                                permId: 'A1',
                                                stackTypeFlags: false,
                                            }),
                                        ]);
                                        tempListChannel.push({
                                            id: doc.id,
                                            chat: res2[0].data.enable,
                                            connect: res2[1].data.enable,
                                            manageRooms: res2[2].data.enable,
                                        });
                                    }
                                } catch (error) {
                                    console.error('Lỗi từ yêu cầu POST:', error);
                                }
                            }

                            return index;
                        }),
                    ).then(() => {
                        setListChannel(tempListChannel);
                    });
                    //Room management
                    axiosInstance
                        .post('/api/permission/checkServerPerm', {
                            idToken: userToken,
                            serverId: serverSelect,
                            permId: 'A1',
                            stackTypeFlags: false,
                        })
                        .then((response) => {
                            setHaveManageRoomsPerm(response.data.enable);
                        });
                    //Invite permissions
                    axiosInstance
                        .post('/api/permission/checkServerPerm', {
                            idToken: userToken,
                            serverId: serverSelect,
                            permId: 'B0',
                            stackTypeFlags: false,
                        })
                        .then((response) => {
                            setHaveInvitePerm(response.data.enable);
                        });
                }
            });
            const unsubscribe2 = onSnapshot(serverDocRef, async (querySnapShot) => {
                setServerInfo(querySnapShot.data());
                setOwned(querySnapShot.data().owner === user.user_id);
            });
            return () => {
                unsubscribe();
                unsubscribe2();
            };
        }
    }, [serverSelect, user.user_id, serverOwner, isHaveAdminPermission, userToken]);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', user.user_id);
        getDoc(userDocRef).then((doc) => {
            if (doc.exists()) {
                setUData({
                    img: doc.data().img,
                    name: doc.data().name,
                });
            }
        });
    }, [user]);

    return (
        <>
            <div className="server_content_main">
                <div className="server_content_main_serverInfo" onClick={() => setOptOpen(!optOpen)}>
                    <h1>{serverInfo?.serverName}</h1>
                    <i>
                        <FontAwesomeIcon icon="fa-solid fa-chevron-down" />
                    </i>
                </div>
                <div style={optOpen ? null : { display: 'none' }} className="server_content_main_serverInfo_opt">
                    {owned === true || isHaveAdminPermission === true ? (
                        <>
                            <button
                                onClick={() => {
                                    setCreateChannelModal(true);
                                    setOptOpen(!optOpen);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-folder-plus" />
                                Create channel
                            </button>
                            <button
                                onClick={() => {
                                    setCreateRoomModal(true);
                                    setOptOpen(!optOpen);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-circle-plus" />
                                Create room
                            </button>
                            <button
                                onClick={() => {
                                    setServerSettingModal(true);
                                    setOptOpen(!optOpen);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-gear" />
                                Server setting
                            </button>
                            <button
                                onClick={() => {
                                    setServerInviteModal(true);
                                    setOptOpen(!optOpen);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                                Invite
                            </button>
                        </>
                    ) : (
                        <>
                            {haveManageRoomsPerm ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setCreateChannelModal(true);
                                            setOptOpen(!optOpen);
                                        }}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-folder-plus" />
                                        Create channel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCreateRoomModal(true);
                                            setOptOpen(!optOpen);
                                        }}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-circle-plus" />
                                        Create room
                                    </button>
                                </>
                            ) : null}
                            <button
                                onClick={() => {
                                    setServerSettingModal(true);
                                    setOptOpen(!optOpen);
                                }}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-gear" />
                                Server setting
                            </button>
                            {haveInvitePerm ? (
                                <button
                                    onClick={() => {
                                        setServerInviteModal(true);
                                        setOptOpen(!optOpen);
                                    }}
                                >
                                    <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                                    Invite
                                </button>
                            ) : null}
                        </>
                    )}
                    {owned ? null : (
                        // <button style={{ color: 'red' }}>
                        //     <FontAwesomeIcon icon="fa-solid fa-trash" />
                        //     Leave Server
                        // </button>
                        <button style={{ color: 'red' }} onClick={() => setLeaveServerModal(true)}>
                            <FontAwesomeIcon icon="fa-solid fa-circle-arrow-left" />
                            Leave Server
                        </button>
                    )}
                </div>
                <div className="server_content_main_serverChanels">
                    <div className="server_content_main_serverChanels_container">
                        {listChannel.map((channel) => {
                            return (
                                <ChanelFragment
                                    key={channel.id}
                                    channelId={channel.id}
                                    chatEnable={channel.chat}
                                    voiceEnable={channel.connect}
                                    manageRooms={channel.manageRooms}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="server_content_main_onCallControls">
                    {/* <button>a</button>
          <button>a</button> */}
                </div>
                <div className="server_content_main_userMediaInteract">
                    <img src={uData?.img} />
                    <p>{uData?.name}</p>
                    <div className="server_content_main_userMediaInteract_btn">
                        {/* <button>
                            <FontAwesomeIcon icon="fa-solid fa-microphone" />
                        </button>
                        <button>
                            <FontAwesomeIcon icon="fa-solid fa-volume-low" />
                        </button> */}
                    </div>
                </div>
            </div>
            {createChannelModal ? <ServerCreateChannelModal closeModal={() => setCreateChannelModal(false)} /> : null}
            {serverSettingModal ? <ServerSettingModal closeModal={() => setServerSettingModal(false)} /> : null}
            {serverInviteModal ? <ServerInviteModal closeModal={() => setServerInviteModal(false)} /> : null}
            {createRoomModal ? <ServerCreateRoomModal closeModal={() => setCreateRoomModal(false)} /> : null}
            {leaveServerModal ? <ConfirmLeaveServer closeModal={() => setLeaveServerModal(false)} /> : null}
        </>
    );
}

export default ServerContent;
