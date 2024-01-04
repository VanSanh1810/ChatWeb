import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChatSocketContext } from '../../../contexts/ChatSocketContext';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../../configs/firebase';
import axiosInstance from '../../../configs/axiosConfig';

function VoiceRoomContent() {
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const socketContext = useContext(ChatSocketContext);
    const [streamSelected, setStreamSelected] = useState();

    const [alowMic, setAlowMic] = useState(false);
    const [alowVideo, setAlowVideo] = useState(false);

    const videoRef = useRef();

    useEffect(() => {
        Promise.all([
            //Send MIC permissions
            axiosInstance.post(`/api/permission/${roomSelect.channelId !== '0' ? 'checkChannelPerm' : 'checkServerPerm'}`, {
                idToken: userToken,
                serverId: serverSelect,
                channelId: roomSelect.channelId,
                permId: 'D1',
                stackTypeFlags: false,
            }), //Send VIDEO permissions
            axiosInstance.post(`/api/permission/${roomSelect.channelId !== '0' ? 'checkChannelPerm' : 'checkServerPerm'}`, {
                idToken: userToken,
                serverId: serverSelect,
                channelId: roomSelect.channelId,
                permId: 'D2',
                stackTypeFlags: false,
            }),
        ]).then((permRes) => {
            const alowMIC = permRes[0].data.enable;
            const alowVIDEO = permRes[1].data.enable;
            setAlowMic(alowMIC);
            setAlowVideo(alowVIDEO);
            if (socketContext.seletedServerCallRoom) {
                if (socketContext.seletedServerCallRoom !== roomSelect.roomId) {
                    socketContext.endCall();
                    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                    getUserMedia({ video: true, audio: true }, (stream) => {
                        socketContext.setMyStream(stream);
                        // videoRef.current.srcObject = stream;
                        if (!alowMIC) {
                            stream.getAudioTracks().forEach((track) => {
                                track.enabled = false;
                            });
                        }
                        if (!alowVIDEO) {
                            stream.getVideoTracks().forEach((track) => {
                                track.enabled = false;
                            });
                        }
                        // console.log(
                        //     '🚀 ~ file: VoiceRoomContent.jsx:21 ~ getUserMedia ~ socketContext.seletedServerCallRoom:',
                        //     socketContext.seletedServerCallRoom,
                        // );
                        socketContext.socket.emit('user-join-server-call', user.user_id, roomSelect.roomId);
                        socketContext.setSeletedServerCallRoom(roomSelect.roomId);
                    });
                    // join new room
                    ///
                } else {
                    //join old room
                    // console.log(socketContext.peers);
                    videoRef.current.srcObject = socketContext.myStream;
                }
            } else {
                /// first join
                var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                getUserMedia({ video: true, audio: true }, (stream) => {
                    socketContext.setMyStream(stream);
                    // videoRef.current.srcObject = stream;
                    if (!alowMIC) {
                        stream.getAudioTracks().forEach((track) => {
                            track.enabled = false;
                        });
                    }
                    if (!alowVIDEO) {
                        stream.getVideoTracks().forEach((track) => {
                            track.enabled = false;
                        });
                    }
                    // console.log(
                    //     '🚀 ~ file: VoiceRoomContent.jsx:21 ~ getUserMedia ~ socketContext.seletedServerCallRoom:',
                    //     socketContext.seletedServerCallRoom,
                    // );
                    socketContext.socket.emit('user-join-server-call', user.user_id, roomSelect.roomId);
                    socketContext.setSeletedServerCallRoom(roomSelect.roomId);
                });
            }
        });
    }, []);

    useEffect(() => {
        if (videoRef.current && socketContext.myStream) {
            videoRef.current.srcObject = socketContext.myStream;
        }
    }, [socketContext.myStream]);

    const toggleAudio = () => {
        if (socketContext.myStream) {
            socketContext.myStream.getAudioTracks().forEach((track) => {
                track.enabled = !socketContext.isMicOn;
            });
            socketContext.setIsMicOn(!socketContext.isMicOn);
        }
    };
    const toggleVideo = () => {
        if (socketContext.myStream) {
            socketContext.myStream.getVideoTracks().forEach((track) => {
                track.enabled = !socketContext.isVideoOn;
            });
            socketContext.setIsVideoOn(!socketContext.isVideoOn);
        }
    };

    const toggleShareScreen = () => {
        if (!socketContext.isShareScreen) {
            socketContext.startScreenShare();
        } else {
            socketContext.stopScreenSharing();
        }
    };

    return (
        <div className="voice_room_content_main">
            {/* <h2>{socketContext.peers.length}</h2> */}
            <div className="voice_room_content_main_videoGrid">
                {!streamSelected ? (
                    <div className="voice_room_content_video_grid">
                        {socketContext.myStream ? (
                            <video
                                ref={videoRef}
                                muted
                                autoPlay
                                className={socketContext.peers.length > 1 ? 'temp_video three_or_more' : 'temp_video'}
                            ></video>
                        ) : null}
                        {socketContext.peers.map((peer, index) => {
                            return <Video key={index} peer={peer} peerCount={socketContext.peers.length} />;
                        })}
                    </div>
                ) : (
                    <div className="voice_room_content_video_grid_selected"></div>
                )}
            </div>
            <div className="voice_room_content_main_action">
                {alowVideo ? (
                    <>
                        <button className={socketContext.isShareScreen ? 'selected' : ''} onClick={toggleShareScreen}>
                            <FontAwesomeIcon icon="fa-solid fa-display" />
                        </button>
                        <button className={socketContext.isVideoOn ? 'selected' : ''} onClick={toggleVideo}>
                            <FontAwesomeIcon icon="fa-solid fa-video" />
                        </button>
                    </>
                ) : null}
                {alowMic ? (
                    <button className={socketContext.isMicOn ? 'selected' : ''} onClick={toggleAudio}>
                        <FontAwesomeIcon icon="fa-solid fa-microphone" />
                    </button>
                ) : null}
                <button onClick={socketContext.endCall}>
                    <FontAwesomeIcon icon="fa-solid fa-phone" />
                </button>
            </div>
        </div>
    );
}

export default VoiceRoomContent;

const Video = (props) => {
    const ref = useRef();
    const socketContext = useContext(ChatSocketContext);
    const [uData, setUData] = useState();

    useEffect(() => {
        props.peer.on('stream', (stream) => {
            ref.current.srcObject = stream;
            ref.current.play();
        });
        ref.current.srcObject = props.peer.streams[0];

        const item = socketContext.peersRef.current.find((p) => p.peer === props.peer);
        const useDocRef = doc(getFirestore(app), 'users', item.peerId.userId);
        getDoc(useDocRef).then((doc) => {
            setUData({ name: doc.data().name, img: doc.data().img });
            console.table([{ name: doc.data().name, img: doc.data().img }]);
        });
    }, [props.peer, socketContext.peersRef]);

    return <video ref={ref} autoPlay className={props.peerCount > 1 ? 'temp_video three_or_more' : 'temp_video'}></video>;
};
