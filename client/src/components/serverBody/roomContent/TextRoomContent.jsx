import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useContext, useEffect, useRef, useState } from 'react';
import MessageItem from './textRoomComponent/MessageItem';
import MessageImgItem from './textRoomComponent/MessageImgItem';
import { useDispatch, useSelector } from 'react-redux';
import { collection, getDocs, getFirestore, limit, orderBy, query, startAfter } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';
import { getDownloadURL, getMetadata, getStorage, ref, updateMetadata, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { ChatSocketContext } from '../../../contexts/ChatSocketContext';
import axiosInstance from '../../../configs/axiosConfig';
import EmojiSelector from '../../emojiSelector/EmojiSelector';

function TextRoomContent() {
    const dispatch = useDispatch();

    const socketContext = useContext(ChatSocketContext);

    const [chatItmList, setChatItmList] = useState([]);
    const [lastMessRef, setLastMessRef] = useState();
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { serverSelect, roomSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const [listFileInput, setListFileInput] = useState([]);
    const [openEmoji, setOpenEmoji] = useState(false);

    const fileInputRef = useRef();
    const messageInputRef = useRef();
    const messageContainerRef = useRef();

    const [loadType, setLoadType] = useState(true);

    const [alowSendURL, setAlowSendURL] = useState(true);
    const [alowSendFile, setAlowSendFile] = useState(true);

    const [disableSend, setDisableSend] = useState(false);

    useEffect(() => {
        async function getMessData() {
            if (roomSelect.roomId) {
                setChatItmList((chatItms) => []);
                const first = query(
                    collection(
                        getFirestore(app),
                        'servers',
                        serverSelect,
                        'chanels',
                        roomSelect.channelId,
                        'rooms',
                        roomSelect.roomId,
                        'messages',
                    ),
                    orderBy('sendAt', 'desc'),
                    limit(20),
                );
                const documentSnapshots = await getDocs(first);
                let messData = [];
                Promise.all(
                    documentSnapshots.docs.map(async (message, index) => {
                        messData.push({
                            key: message.id,
                            type: message.data().sendBy === user.user_id ? '' : 'other',
                            msg: message.data().message,
                            mediaData: message.data().mediaData,
                            sendAt: message.data().sendAt,
                            sendBy: message.data().sendBy,
                            isImg: message.data().isImg,
                        });
                        return index;
                    }),
                ).then(() => {
                    let newMessData = [];
                    for (let i = 0; i < messData.length; i++) {
                        if (messData[i - 1]) {
                            if (messData[i - 1].sendBy === messData[i].sendBy) {
                                newMessData.push({
                                    ...messData[i],
                                    style: 'inside',
                                    isFirst: messData[i + 1]
                                        ? messData[i + 1].sendBy !== messData[i].sendBy
                                            ? true
                                            : false
                                        : true,
                                });
                            } else {
                                newMessData.push({
                                    ...messData[i],
                                    style: 'last',
                                    isFirst: messData[i + 1]
                                        ? messData[i + 1].sendBy !== messData[i].sendBy
                                            ? true
                                            : false
                                        : true,
                                });
                            }
                        } else {
                            newMessData.push({
                                ...messData[i],
                                style: 'last',
                                isFirst: messData[i + 1] ? (messData[i + 1].sendBy !== messData[i].sendBy ? true : false) : true,
                            });
                        }
                    }
                    const revMessData = newMessData.reverse();
                    setChatItmList((chatItms) => [...revMessData]);
                    setLoadType(true);
                });
                // Get the last visible document
                const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
                setLastMessRef(lastVisible);
            }
        }
        getMessData();
    }, [roomSelect, serverSelect, user.user_id]);

    const handleMessContainScroll = async (e) => {
        if (e.currentTarget.scrollTop === 0) {
            setLoadType(false);
            const first = query(
                collection(
                    getFirestore(app),
                    'servers',
                    serverSelect,
                    'chanels',
                    roomSelect.channelId,
                    'rooms',
                    roomSelect.roomId,
                    'messages',
                ),
                orderBy('sendAt', 'desc'),
                limit(10),
                startAfter(lastMessRef),
            );
            const documentSnapshots = await getDocs(first);
            let messData = [];
            Promise.all(
                documentSnapshots.docs.map(async (message, index) => {
                    messData.push({
                        key: message.id,
                        type: message.data().sendBy === user.user_id ? '' : 'other',
                        msg: message.data().message,
                        mediaData: message.data().mediaData,
                        sendAt: message.data().sendAt,
                        sendBy: message.data().sendBy,
                        isImg: message.data().isImg,
                    });
                    return index;
                }),
            ).then(() => {
                let newMessData = [];
                for (let i = 0; i < messData.length; i++) {
                    if (messData[i - 1]) {
                        if (messData[i - 1].sendBy === messData[i].sendBy) {
                            newMessData.push({
                                ...messData[i],
                                style: 'inside',
                                isFirst: messData[i + 1] ? (messData[i + 1].sendBy !== messData[i].sendBy ? true : false) : true,
                            });
                        } else {
                            newMessData.push({
                                ...messData[i],
                                style: 'last',
                                isFirst: messData[i + 1] ? (messData[i + 1].sendBy !== messData[i].sendBy ? true : false) : true,
                            });
                        }
                    } else {
                        newMessData.push({
                            ...messData[i],
                            style: 'last',
                            isFirst: messData[i + 1] ? (messData[i + 1].sendBy !== messData[i].sendBy ? true : false) : true,
                        });
                    }
                }
                const revMessData = newMessData.reverse();
                setChatItmList((chatItms) => [...revMessData, ...chatItms]);
            });
            // Get the last visible document
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastMessRef(lastVisible);
        }
    };

    useEffect(() => {
        socketContext.socket.on('resive-message', async (messageObj, roomId, channelId, serverId, curentUserUid) => {
            if (roomId === roomSelect.roomId) {
                setChatItmList((chatItms) => [
                    // ????
                    ...chatItms,
                    {
                        key: messageObj.id,
                        type: curentUserUid === user.user_id ? '' : 'other',
                        msg: messageObj.messData,
                        mediaData: messageObj.mediaData,
                        sendAt: messageObj.sendAt,
                        sendBy: messageObj.sendBy,
                        isImg: messageObj.isImg,
                        isFirst: chatItms[chatItms.length - 1]
                            ? chatItms[chatItms.length - 1].sendBy !== messageObj.sendBy
                                ? true
                                : false
                            : true,
                        style: 'last',
                    },
                ]);
                // axiosInstance.put(
                //     '/api/chat/confirmSeenDM',
                //     { idToken: userToken, chatId: selectedChatData.chatId },
                //     {
                //         withCredentials: true,
                //     },
                // );
            }
            // else {
            //     //for notify stack
            //     let tempList = [...dmNotifyArray];
            //     const newArrayKeyValue = await Promise.all(
            //         tempList.map((item) => {
            //             if (item.key === curentUserUid) {
            //                 return { key: curentUserUid, value: item.value + 1 };
            //             }
            //             return item;
            //         }),
            //     );
            // }
        });
        return () => socketContext.socket.off('resive-message');
    }, [roomSelect, socketContext.socket, user.user_id]);

    useEffect(() => {
        if (loadType) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messageContainerRef, chatItmList, loadType]);

    useEffect(() => {
        //Send URL permissions
        axiosInstance
            .post(`/api/permission/${roomSelect.channelId !== '0' ? 'checkChannelPerm' : 'checkServerPerm'}`, {
                idToken: userToken,
                serverId: serverSelect,
                channelId: roomSelect.channelId,
                permId: 'C1',
                stackTypeFlags: false,
            })
            .then((response) => {
                setAlowSendURL(response.data.enable ? true : false);
            });
        //Send File permissions
        axiosInstance
            .post(`/api/permission/${roomSelect.channelId !== '0' ? 'checkChannelPerm' : 'checkServerPerm'}`, {
                idToken: userToken,
                serverId: serverSelect,
                channelId: roomSelect.channelId,
                permId: 'C2',
                stackTypeFlags: false,
            })
            .then((response) => {
                setAlowSendFile(response.data.enable ? true : false);
            });
    }, [userToken, serverSelect, roomSelect]);

    const onClickInputMedia = () => {
        fileInputRef.current.click();
    };

    const handleInputFiles = (e) => {
        if (e.target.files.length !== 0) {
            let overSize = false;
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const fileSize = file.size;
                if (fileSize > 25 * 1024 * 1024) {
                    dispatch(
                        setToastState({
                            key: Date.now(),
                            Tstate: toastType.error,
                            Tmessage: 'Please choose a file smaller than 25MB in size.',
                        }),
                    );
                    // Xóa tệp khỏi danh sách nếu cần
                    // files.splice(i, 1);
                    overSize = true;
                    break;
                }
            }
            if (!overSize) {
                setListFileInput([...listFileInput, ...e.target.files]);
            }
        }
    };

    const removeInputFile = (index) => {
        const newArray = [...listFileInput];
        newArray.splice(index, 1);
        setListFileInput(newArray);
    };

    async function uploadFile(file) {
        const storageRef = ref(getStorage(app), `serverStorage/${serverSelect}/${roomSelect.roomId}/${Date.now() + file.name}`);
        try {
            const snapshot = await uploadBytes(storageRef, file);
            console.log(`Uploaded ${file.name}`);
            const metadata = await getMetadata(storageRef);
            metadata.customMetadata = {
                uploadedAt: Date.now(),
            };
            await updateMetadata(storageRef, metadata);
            return snapshot; // Trả về snapshot cho tệp đã tải lên
        } catch (error) {
            console.error(`Error uploading ${file.name}: ${error.message}`);
            throw error;
        }
    }

    async function uploadAllFiles(files) {
        try {
            // Tải lên nhiều tệp cùng một lúc
            const uploadPromises = files.map(uploadFile);
            const uploadSnapshots = await Promise.all(uploadPromises);

            // Tất cả các tệp đã được tải lên thành công
            console.log('All files uploaded successfully!');

            // Thực hiện lệnh tiếp theo sau khi tất cả các tệp đã được tải lên
            // Ví dụ: gọi hàm để xử lý dữ liệu tệp sau khi tải lên
            return processUploadedFiles(uploadSnapshots);
        } catch (error) {
            console.error('Error uploading files:', error);
        }
    }

    async function processUploadedFiles(uploadSnapshots) {
        // Thực hiện xử lý dữ liệu tệp sau khi tải lên ở đây
        // Ví dụ: lưu các URL của tệp vào cơ sở dữ liệu
        // ... Tiếp tục xử lý dữ liệu tệp ...
        try {
            const downloadURLs = await Promise.all(
                uploadSnapshots.map(async (snapshot) => {
                    // Thực hiện xử lý dữ liệu tệp sau khi tải lên và trả về URL tải về
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    // Thực hiện các công việc xử lý khác tại đây (nếu cần)
                    // ...
                    return downloadURL;
                }),
            );

            // Tất cả các tệp đã được xử lý và có thể truy cập thông qua downloadURLs
            console.log('All files processed successfully!');
            return downloadURLs;

            // Tiếp tục với các công việc khác sau khi tất cả các tệp đã được xử lý
            // ...
        } catch (error) {
            console.error('Error processing files:', error);
        }
    }

    function detectURLs(message) {
        var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        if (message.match(urlRegex).length) {
            return true;
        } else {
            return false;
        }
    }

    //Send data
    const onSendMessageClick = async () => {
        if (disableSend) {
            return;
        }
        // if (!detectURLs(messageInputRef.current.value) || alowSendURL === true) {
        const a = true;
        if (a) {
            setDisableSend(true);
            let listFileURL = [];
            if (listFileInput.length > 0) {
                listFileURL = await uploadAllFiles(listFileInput);
            }
            setListFileInput([]);
            if (messageInputRef.current.value.trim()) {
                const messObj = {
                    id: uuidv4(),
                    messData: messageInputRef.current.value.trim(),
                    mediaData: [],
                    sendAt: Date.now(),
                    sendBy: user.user_id,
                    isImg: false,
                };
                socketContext.socket.emit(
                    'send-message',
                    messObj,
                    roomSelect.roomId,
                    roomSelect.channelId,
                    serverSelect,
                    user.user_id,
                );
            }
            if (listFileURL.length > 0) {
                const messObjMedia = {
                    id: uuidv4(),
                    messData: '',
                    mediaData: listFileURL,
                    sendAt: Date.now(),
                    sendBy: user.user_id,
                    isImg: true,
                };
                socketContext.socket.emit(
                    'send-message',
                    messObjMedia,
                    roomSelect.roomId,
                    roomSelect.channelId,
                    serverSelect,
                    user.user_id,
                );
            }
            messageInputRef.current.value = '';
            setDisableSend(false);
        }
    };

    const handleKeyPress = async (event) => {
        if (event.key === 'Enter') {
            // Xử lý khi người dùng nhấn phím "Enter" ở đây
            onSendMessageClick();
            event.target.value = '';
        }
    };

    const addEmoji = (emo) => {
        messageInputRef.current.value = messageInputRef.current.value + emo;
        //setMessInput(messInput + emo);
    };

    return (
        <div className="text_room_content_main">
            <div className="text_room_content_chat_contain" onScroll={handleMessContainScroll} ref={messageContainerRef}>
                {chatItmList.map((message) => {
                    if (message.isImg) {
                        return <MessageImgItem key={message.key} sender={message.type} messData={message} />;
                    } else {
                        return <MessageItem key={message.key} sender={message.type} messData={message} />;
                    }
                })}
            </div>
            <div className="text_room_content_chat_input">
                {listFileInput.length > 0 ? (
                    <div className="review-media-div">
                        {listFileInput.map((file, index) => {
                            return <ReviewFile key={index} file={file} onRemoveClick={() => removeInputFile(index)} />;
                        })}
                    </div>
                ) : null}
                <div className="sendNewMessage" style={{ background: 'none', margin: '0px' }}>
                    {alowSendFile ? (
                        <>
                            <input
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                type="file"
                                multiple={true}
                                onChange={handleInputFiles}
                            />
                            <button className="addFiles" onClick={onClickInputMedia}>
                                <i className="fa fa-plus" style={{ color: '#2b2b2b' }}>
                                    <FontAwesomeIcon icon="fa-solid fa-image" />
                                </i>
                            </button>
                        </>
                    ) : null}
                    {/* <button style={{ marginLeft: '5px', color: '#2b2b2b' }} className="addFiles">
                        <i className="fa fa-plus">
                            <FontAwesomeIcon icon="fa-solid fa-paperclip" />
                        </i>
                    </button> */}
                    <button
                        style={{ marginLeft: '5px', color: '#2b2b2b' }}
                        className="addFiles"
                        onClick={() => setOpenEmoji(!openEmoji)}
                    >
                        <i className="fa fa-plus">
                            <FontAwesomeIcon icon="fa-solid fa-face-smile" />
                        </i>
                    </button>
                    {openEmoji ? <EmojiSelector addEmo={addEmoji} /> : null}
                    <input
                        style={{ fontFamily: "'Roboto', sans-serif", fontWeight: '700' }}
                        autoComplete="off"
                        name="chatMessageInput"
                        type="text"
                        placeholder="Type a message here"
                        ref={messageInputRef}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        onClick={onSendMessageClick}
                        className="btnSendMsg"
                        id="sendMsgBtn"
                        style={{ color: '#2b2b2b', backgroundColor: '#fff' }}
                    >
                        <i className="fa fa-paper-plane">
                            <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                        </i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TextRoomContent;

const ReviewFile = (props) => {
    function checkFileType(file) {
        // Lấy phần mở rộng của tên file
        const fileExtension = file.type.split('/');

        // Kiểm tra kiểu file dựa trên phần mở rộng
        switch (fileExtension[0]) {
            case 'image':
                return 1; // Ảnh
            case 'video':
                return 2; // Video
            default:
                return 3; // Loại file khác
        }
    }

    const generateVideoThumbnail = (file) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const video = document.createElement('video');

            // this is important
            video.autoplay = true;
            video.muted = true;
            video.src = URL.createObjectURL(file);

            video.onloadeddata = () => {
                let ctx = canvas.getContext('2d');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                video.pause();
                return resolve(canvas.toDataURL('image/png'));
            };
        });
    };
    let componentToRender;

    switch (checkFileType(props.file)) {
        case 1:
            componentToRender = <img src={URL.createObjectURL(props.file)}></img>;
            break;
        case 2:
            componentToRender = <video src={`${URL.createObjectURL(props.file)}#t=1`}></video>;
            break;
        default:
            componentToRender = (
                <div className="nonfile_div">
                    <FontAwesomeIcon icon="fa-solid fa-file-lines" />
                    <span>{props.file.name}</span>
                </div>
            );
            break;
    }

    useEffect(() => {}, []);

    return (
        <div className="file-item-container" onClick={props.onRemoveClick}>
            {componentToRender}
        </div>
    );
};
