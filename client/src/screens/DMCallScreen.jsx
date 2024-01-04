import { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { Peer } from 'peerjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../configs/firebase';
import { v4 as uuidv4 } from 'uuid';

function DMCallScreen() {
    // const socketContext = useContext(ChatSocketContext);
    const { slug } = useParams();

    const [test, setTest] = useState('abc');
    const { user } = useSelector((state) => state.persistedReducer.authReducer);

    const [callStatus, setCallStatus] = useState(true);
    const [videoStream, setVideoStream] = useState();
    const [screenStream, setScreenStream] = useState();
    const [myPeer, setMyPeer] = useState();
    const [callMessage, setCallMessage] = useState();
    const [targetUser, setTargetUser] = useState();

    const [currentCall, setCurrentCall] = useState();
    const [currentSocket, setCurrentSocket] = useState();

    const [isWaiting, setIsWaiting] = useState(false);
    const [tagetData, setTagetData] = useState();
    const [myData, setMyData] = useState();

    // const [peer, setPeer] = useState(null);

    const myVideo = useRef();
    const otherVideo = useRef();
    const connectionRef = useRef();

    const location = useLocation();

    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isShareScreenEnabled, setIsShareScreenEnabled] = useState(false);

    const [_noCam, setNoCam] = useState(false);

    useEffect(() => {
        // Truy cập query parameters từ URL
        const queryParams = new URLSearchParams(location.search);
        // Lấy giá trị của query parameter cụ thể
        const paramValue = queryParams.get('calling');
        const callTarget = queryParams.get('callTarget'); // Call to who
        const roomTarget = queryParams.get('roomTarget'); // use exact room as chat room
        const noCam = queryParams.get('noCam'); // use exact room as chat room
        ////////////////////////////////
        const targetDocRef = doc(getFirestore(app), 'users', callTarget);
        getDoc(targetDocRef).then((doc) => {
            if (doc.exists()) {
                setTagetData(doc.data());
            }
        });
        const myDocRef = doc(getFirestore(app), 'users', user.user_id);
        getDoc(myDocRef).then((doc) => {
            if (doc.exists()) {
                setMyData(doc.data());
            }
        });
        ////////////////////////////////
        setTest(paramValue);
        const socket = io(import.meta.env.VITE_BASE_URL);
        setCurrentSocket(socket);
        socket.on('connect', () => {
            var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            getUserMedia(
                { video: true, audio: true },
                (stream) => {
                    socket.emit('join-room', roomTarget);
                    socket.emit('join-room', slug);
                    myVideo.current.srcObject = stream;
                    setVideoStream(stream);
                    if (paramValue) {
                        setIsWaiting(true);
                        const peer = new Peer(user.user_id);
                        peer.on('open', (id) => {
                            console.log('My peer ID is: ' + id);
                            socket.emit('join-dm-call-room', slug, roomTarget, user.user_id, id);
                        });

                        socket.on('user-joined-dm-call-room', async (callRoomId, chatRoomId, userId, peerID) => {
                            if (userId !== user.user_id) {
                                // other user is connected
                                // console.log('Stream:' + peerID);
                                setTargetUser(userId);
                                setIsWaiting(false);
                                console.log('other user is connected');
                                let call = peer.call(peerID, stream);
                                call.on('stream', function (remoteStream) {
                                    // Show stream in some video/canvas element.
                                    otherVideo.current.srcObject = remoteStream;
                                    otherVideo.current.play();
                                });
                                setCurrentCall(call);
                            }
                        });

                        socket.on('rejected-dm-call-room', async (callRoomId, chatRoomId, userId, message) => {
                            if (userId !== user.user_id) {
                                // other user rejected the call
                                setIsWaiting(false);
                                setCallMessage(message);
                                peer.destroy();
                                setCallStatus(false);
                            }
                        });
                        setMyPeer(peer);
                        connectionRef.current = peer;
                    } else {
                        //resiver
                        const peer = new Peer(user.user_id);

                        peer.on('open', (id) => {
                            console.log('My peer ID is: ' + id);
                            socket.emit('join-dm-call-room', slug, roomTarget, user.user_id, id);
                        });

                        peer.on('call', (call) => {
                            // Answer the call, providing our mediaStream
                            call.answer(stream);
                            call.on('stream', function (remoteStream) {
                                otherVideo.current.srcObject = remoteStream;
                                otherVideo.current.play();
                            });
                            setCurrentCall(call);
                        });

                        setMyPeer(peer);
                        connectionRef.current = peer;
                    }

                    if (noCam) {
                        stream.getVideoTracks().forEach((track) => {
                            track.enabled = false;
                        });
                        setIsVideoEnabled(false);
                        setNoCam(true);
                    }
                },
                function (err) {
                    console.log('Failed to get local stream', err);
                },
            );
        });

        socket.on('user-leave-dm-call-room', (callRoomId, chatRoomId, userLeave) => {
            setCallMessage('Call end');
            setCallStatus(false);
            connectionRef.current.destroy();
        });
        const handleBeforeUnload = () => {
            // if (isWaiting) {
            //     const messObj = {
            //         id: uuidv4(),
            //         messData: 'Miss call',
            //         mediaData: [],
            //         sendAt: Date.now(),
            //         type: 'call',
            //     };
            //     socket.emit('send-dm-message', messObj, roomTarget, user.user_id, callTarget);
            // }
            socket.emit('leave-dm-call-room', slug, roomTarget, user.user_id);
            connectionRef.current.destroy();
        };
        const handleUnload = () => {
            // Thực hiện hành động sau khi tab đã đóng ở đây
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
            socket.disconnect();
        };
    }, []);

    const toggleAudio = () => {
        if (videoStream) {
            videoStream.getAudioTracks().forEach((track) => {
                track.enabled = !isAudioEnabled;
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };
    const toggleVideo = () => {
        if (videoStream) {
            videoStream.getVideoTracks().forEach((track) => {
                track.enabled = !isVideoEnabled;
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleShareScreen = () => {
        if (!isShareScreenEnabled) {
            startScreenShare();
        } else {
            stopScreenSharing();
        }
    };

    function startScreenShare() {
        navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
            setScreenStream(stream);
            let videoTrack = stream.getVideoTracks()[0];
            videoTrack.onended = () => {
                stopScreenSharing();
            };
            if (connectionRef.current) {
                let sender = currentCall.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                });
                sender.replaceTrack(videoTrack);
                setIsShareScreenEnabled(true);
            }
        });
    }

    function stopScreenSharing() {
        let videoTrack = videoStream.getVideoTracks()[0];
        if (connectionRef.current) {
            let sender = currentCall.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            });
            sender.replaceTrack(videoTrack);
        }
        screenStream.getTracks().forEach(function (track) {
            track.stop();
        });
        setIsShareScreenEnabled(false);
    }

    useEffect(() => {
        if (!callStatus) {
            if (videoStream) {
                videoStream.getTracks().forEach((track) => {
                    track.stop();
                });
                setVideoStream(null);
            }
        }
    }, [callStatus, videoStream]);

    return (
        <div className="dm_call_screen_main">
            <div className="dm_call_screen_video_container">
                <video ref={otherVideo} autoPlay></video>
                {isWaiting ? (
                    <div className="text_on_dm_call_target">
                        <img src={tagetData?.img}></img>
                        <h3>{`Calling ${tagetData?.name}`}</h3>
                    </div>
                ) : null}
            </div>
            <video id="myDMVideo" ref={myVideo} autoPlay muted></video>
            <div id="myDMVideo_overLay">
                {!isAudioEnabled ? (
                    <div className="myDMVideo_overLay_mic">
                        <FontAwesomeIcon icon="fa-solid fa-microphone-slash" />
                    </div>
                ) : null}
                {!isVideoEnabled ? (
                    <div className="myDMVideo_overLay_video">
                        <img src={myData?.img}></img>
                    </div>
                ) : null}
            </div>
            {callMessage ? <h1 className="dm_call_screen_status">{callMessage}</h1> : null}
            <div className="dm_call_screen_action_container">
                {callStatus ? (
                    <>
                        <button onClick={toggleShareScreen} className={isShareScreenEnabled ? 'selected' : ''}>
                            <FontAwesomeIcon icon="fa-solid fa-display" />
                        </button>
                        <button onClick={toggleAudio} className={isAudioEnabled ? 'selected' : ''}>
                            {isAudioEnabled ? (
                                <FontAwesomeIcon icon="fa-solid fa-microphone" />
                            ) : (
                                <FontAwesomeIcon icon="fa-solid fa-microphone-slash" />
                            )}
                        </button>
                        <button onClick={toggleVideo} className={isVideoEnabled ? 'selected' : ''}>
                            {isVideoEnabled ? (
                                <FontAwesomeIcon icon="fa-solid fa-video" />
                            ) : (
                                <FontAwesomeIcon icon="fa-solid fa-video-slash" />
                            )}
                        </button>
                        <button onClick={() => window.close()}>
                            <FontAwesomeIcon icon="fa-solid fa-phone-slash" />
                        </button>
                    </>
                ) : (
                    <button onClick={() => window.close()}>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default DMCallScreen;
