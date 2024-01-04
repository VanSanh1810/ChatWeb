import { useState, createRef, useEffect, useMemo, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, doc, getDoc, getFirestore, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '../../../configs/axiosConfig';

import './chatContent.css';
import Avatar from '../chatList/Avatar';
import ChatItem from './ChatItem';
import app from '../../../configs/firebase';
import { getStorage, ref, uploadBytes, updateMetadata, getMetadata, getDownloadURL } from 'firebase/storage';
import { setToastState, toastType } from '../../../store/reducers/toastReducer';
import { ChatSocketContext } from '../../../contexts/ChatSocketContext';
import EmojiSelector from '../../emojiSelector/EmojiSelector';

function ChatContent(props) {
    const dispatch = useDispatch();

    const socketContext = useContext(ChatSocketContext);

    const messagesEndRef = createRef(null);
    const fileInputRef = createRef(null);
    const messageContainerRef = createRef(null);

    const { selectedChatData } = useSelector((state) => state.persistedReducer.chatReducer);
    const { user } = useSelector((state) => state.persistedReducer.authReducer);
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const { dmNotifyArray } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const { inCommingDMCall } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);

    const [currentChatUserData, setCurrentChatUserData] = useState({});
    const [chatItms, setChatItms] = useState([]);
    const memoizedChatItms = useMemo(() => chatItms, [chatItms]);
    const [loadType, setLoadType] = useState(true);

    const [listFileInput, setListFileInput] = useState([]);
    const [messInput, setMessInput] = useState('');

    const messInputRef = useRef();

    const [openEmoji, setOpenEmoji] = useState(false);
    const [disableSendBtn, setDisableSendBtn] = useState(false);

    useEffect(() => {
        if (selectedChatData.userChatId) {
            const tagetRef = doc(getFirestore(app), 'users', selectedChatData.userChatId);
            getDoc(tagetRef).then((doc) => {
                if (doc.exists()) {
                    setCurrentChatUserData(doc.data());
                }
            });
            const myDocRef = doc(getFirestore(app), 'users', user.user_id);
            getDocs(collection(myDocRef, 'blockList')).then((docs) => {
                Promise.all(
                    docs.docs.map((doc, index) => {
                        if (doc.id === selectedChatData.userChatId) {
                            props.setIsBlocked(true); // if you blocking
                        }
                        return index;
                    }),
                );
            });
        }
    }, [selectedChatData, user.user_id]);

    useEffect(() => {
        socketContext.socket.on('resive-dm-message', async (message, roomId, curentUserUid) => {
            if (roomId === selectedChatData.chatId) {
                //Receive message when in chat
                setChatItms((chatItms) => [
                    ...chatItms,
                    {
                        key: message.id,
                        type: curentUserUid === user.user_id ? '' : 'other',
                        msg: message.messData,
                        mediaData: message.mediaData,
                        sendAt: message.sendAt,
                        _type: message.type ? message.type : null,
                    },
                ]);
                axiosInstance.put(
                    '/api/chat/confirmSeenDM',
                    { idToken: userToken, chatId: selectedChatData.chatId },
                    {
                        withCredentials: true,
                    },
                );
            }
        });
        return () => socketContext.socket.off('resive-dm-message');
    }, [selectedChatData, socketContext.socket, user.user_id, userToken, dmNotifyArray]);

    useEffect(() => {
        if (loadType) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messageContainerRef, chatItms, loadType]);

    const [lastMessRef, setLastMessRef] = useState();

    useEffect(() => {
        async function getMessData() {
            if (selectedChatData.chatId) {
                setChatItms((chatItms) => []);
                const first = query(
                    collection(getFirestore(app), 'chatLists', selectedChatData.chatId, 'messages'),
                    orderBy('sendAt', 'desc'),
                    limit(11),
                );
                const documentSnapshots = await getDocs(first);
                let messData = [];
                await Promise.all(
                    documentSnapshots.docs.map(async (message, index) => {
                        messData.push({
                            key: message.id,
                            type: message.data().sendBy === user.user_id ? '' : 'other',
                            msg: message.data().message,
                            mediaData: message.data().mediaData,
                            sendAt: message.data().sendAt,
                            _type: message.type ? message.type : null,
                        });
                        return index;
                    }),
                );
                const revMessData = await messData.reverse();
                setChatItms((chatItms) => [...revMessData]);
                setLoadType(true);
                // Get the last visible document
                const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
                setLastMessRef(lastVisible);
            }
        }
        getMessData();
    }, [selectedChatData.chatId, user.user_id]);

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

                    overSize = true;
                    break;
                }
            }
            if (!overSize) {
                setListFileInput([...listFileInput, ...e.target.files]);
            } else {
                console.log('overSize');
            }
        }
    };

    const removeInputFile = (index) => {
        const newArray = [...listFileInput];
        newArray.splice(index, 1);
        setListFileInput(newArray);
    };

    const handleKeyPress = async (event) => {
        if (event.key === 'Enter') {
            // Xử lý khi người dùng nhấn phím "Enter" ở đây
            onSendMessageClick();
            event.target.value = '';
        }
    };

    //Send data
    const onSendMessageClick = async () => {
        if(disableSendBtn){
            return;
        }
        setDisableSendBtn(true);
        const useBlockRef = doc(getFirestore(app), 'users', user.user_id, 'blockByList', selectedChatData.userChatId);
        getDoc(useBlockRef).then(async (doc) => {
            if (!doc.exists()) {
                let listFileURL = [];
                if (listFileInput.length > 0) {
                    listFileURL = await uploadAllFiles(listFileInput);
                }
                setListFileInput([]);
                const messObj = {
                    id: uuidv4(),
                    messData: messInput.trim() ? messInput.trim() : '',
                    mediaData: listFileURL.length > 0 ? listFileURL : [],
                    sendAt: Date.now(),
                };
                if (messInput.trim() || listFileURL.length > 0) {
                    socketContext.socket.emit(
                        'send-dm-message',
                        messObj,
                        selectedChatData.chatId,
                        user.user_id,
                        selectedChatData.userChatId,
                    );
                }
                setMessInput('');
                messInputRef.current.value = '';
            } else {
                dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'Unable to send message !' }));
            }
            setDisableSendBtn(false);
        });
    };

    async function uploadFile(file) {
        const storageRef = ref(getStorage(app), `chatRoomStorage/${selectedChatData.chatId}/${Date.now() + file.name}`);
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

    const handleMessContainScroll = async (e) => {
        if (e.currentTarget.scrollTop === 0) {
            setLoadType(false);
            const first = query(
                collection(getFirestore(app), 'chatLists', selectedChatData.chatId, 'messages'),
                orderBy('sendAt', 'desc'),
                limit(5),
                startAfter(lastMessRef),
            );
            const documentSnapshots = await getDocs(first);
            let messData = [];
            await Promise.all(
                documentSnapshots.docs.map(async (message, index) => {
                    messData.push({
                        key: message.id,
                        type: message.data().sendBy === user.user_id ? '' : 'other',
                        msg: message.data().message,
                        mediaData: message.data().mediaData,
                        sendAt: message.data().sendAt,
                    });
                    return index;
                }),
            );
            const revMessData = messData.reverse();
            setChatItms((chatItms) => [...revMessData, ...chatItms]);
            // Get the last visible document
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastMessRef(lastVisible);
        }
    };

    ////
    const openNewCallWindow = () => {
        let callRoomId = uuidv4();
        // URL của trang bạn muốn mở trong cửa sổ mới
        const newWindowURL = `${import.meta.env.VITE_CLIENT_URL}/dmcall/ROOM/${callRoomId}?calling=true&callTarget=${
            selectedChatData.userChatId
        }&roomTarget=${selectedChatData.chatId}`;
        // const newWindowURL = `${import.meta.env.VITE_CLIENT_URL}`;

        // Mở cửa sổ mới
        const newWindow = window.open(newWindowURL, 'NewWindowName', 'width=1000,height=800');
        newWindow.postMessage('Hello from Parent', newWindowURL);

        // Kiểm tra xem cửa sổ có được mở thành công không
        if (newWindow) {
            // Cửa sổ được mở thành công, bạn có thể thực hiện các tác vụ khác tại đây
            socketContext.socket.emit('request-dm-call-room', {
                callRoom: callRoomId,
                chatRoom: selectedChatData.chatId,
                userCalling: user.user_id,
                noCam: false,
            });
            console.log(callRoomId);
        } else {
            // Cửa sổ không được mở thành công (có thể do chặn popup bởi trình duyệt)
            alert('Không thể mở cửa sổ mới. Hãy kiểm tra cài đặt chặn popup của trình duyệt.');
        }
    };

    ////
    const openNewCallWindow2 = () => {
        let callRoomId = uuidv4();
        // URL của trang bạn muốn mở trong cửa sổ mới
        const newWindowURL = `${import.meta.env.VITE_CLIENT_URL}/dmcall/ROOM/${callRoomId}?calling=true&noCam=true&callTarget=${
            selectedChatData.userChatId
        }&roomTarget=${selectedChatData.chatId}`;
        // const newWindowURL = `${import.meta.env.VITE_CLIENT_URL}`;

        // Mở cửa sổ mới
        const newWindow = window.open(newWindowURL, 'NewWindowName', 'width=1000,height=800');
        newWindow.postMessage('Hello from Parent', newWindowURL);

        // Kiểm tra xem cửa sổ có được mở thành công không
        if (newWindow) {
            // Cửa sổ được mở thành công, bạn có thể thực hiện các tác vụ khác tại đây
            socketContext.socket.emit('request-dm-call-room', {
                callRoom: callRoomId,
                chatRoom: selectedChatData.chatId,
                userCalling: user.user_id,
                noCam: true,
            });
            console.log(callRoomId);
        } else {
            // Cửa sổ không được mở thành công (có thể do chặn popup bởi trình duyệt)
            alert('Không thể mở cửa sổ mới. Hãy kiểm tra cài đặt chặn popup của trình duyệt.');
        }
    };

    const unBlock = () => {
        axiosInstance
            .post('/api/userInterractAction', {
                idToken: userToken,
                targetId: selectedChatData.userChatId,
                action: 'unblock',
            })
            .then(() => {
                props.setIsBlocked(false);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const addEmoji = (emo) => {
        // console.log(emo);
        messInputRef.current.value = messInputRef.current.value + emo;
        setMessInput(messInput + emo);
    };

    return (
        <div className="main__chatcontent">
            <div className="content__header">
                <div className="blocks">
                    <div className="current-chatting-user">
                        {currentChatUserData.img ? <Avatar isOnline="active" image={currentChatUserData.img} /> : null}
                        <p>{currentChatUserData.name}</p>
                    </div>
                </div>
                {currentChatUserData.img ? (
                    <div className="blocks chat_actions">
                        {!props.isBlocked ? (
                            <>
                                <div className="call">
                                    <button className="btn-call" onClick={openNewCallWindow2}>
                                        <i className="fa-solid fa-phone">
                                            <FontAwesomeIcon icon="fa-solid fa-phone" />
                                        </i>
                                    </button>
                                </div>
                                <div className="call-video" onClick={openNewCallWindow}>
                                    <button className="btn-call-video">
                                        <i className="fa-solid fa-video">
                                            <FontAwesomeIcon icon="fa-solid fa-video" />
                                        </i>
                                    </button>
                                </div>
                            </>
                        ) : null}
                        <div className="settings">
                            <button className="btn-nobg" onClick={() => props.togleChatProfile()}>
                                <i className="fa fa-cog">
                                    <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
                                </i>
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
            <div className="content__body" ref={messageContainerRef} onScroll={handleMessContainScroll}>
                <div className="chat__items">
                    {memoizedChatItms.map((itm, index) => {
                        return (
                            <ChatItem
                                animationDelay={index + 1}
                                key={itm.key}
                                user={itm.type}
                                msg={itm.msg}
                                mediaData={itm.mediaData}
                                sendAt={itm.sendAt}
                                type={itm._type}
                            />
                        );
                    })}
                    {/* {currentChatUserData.name ? (
                        <h2 style={{ opacity: '23%' }}>Send message to start the conversation</h2>
                    ) : chatItms.length <= 0 ? (
                        <h2 style={{ opacity: '23%' }}>Select a conversation to continue.</h2>
                    ) : null} */}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="content__footer">
                {listFileInput.length > 0 ? (
                    <div className="review-media-div">
                        {listFileInput.map((file, index) => {
                            return <ReviewFile key={index} file={file} onRemoveClick={() => removeInputFile(index)} />;
                        })}
                    </div>
                ) : null}
                {!props.isBlocked ? (
                    <div style={{ visibility: currentChatUserData.img ? true : 'hidden' }} className="sendNewMessage">
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleInputFiles}
                            multiple={true}
                        />
                        <button className="addFiles" onClick={onClickInputMedia}>
                            <i className="fa fa-plus">
                                <FontAwesomeIcon icon="fa-solid fa-image" />
                            </i>
                        </button>
                        {/* <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={fileInputRef2}
                            onChange={handleInputFiles2}
                            multiple={true}
                        />
                        <button style={{ marginLeft: '5px' }} className="addFiles" onClick={onClickInputMedia2}>
                            <i className="fa fa-plus">
                                <FontAwesomeIcon icon="fa-solid fa-paperclip" />
                            </i>
                        </button> */}
                        <button style={{ marginLeft: '5px' }} className="addFiles" onClick={() => setOpenEmoji(!openEmoji)}>
                            <i className="fa fa-plus">
                                <FontAwesomeIcon icon="fa-solid fa-face-smile" />
                            </i>
                        </button>
                        {openEmoji ? <EmojiSelector addEmo={addEmoji} /> : null}
                        <input
                            autoComplete="off"
                            name="chatMessageInput"
                            type="text"
                            placeholder="Type a message here"
                            onKeyPress={handleKeyPress}
                            defaultValue={messInput}
                            ref={messInputRef}
                            onChange={(e) => setMessInput(e.target.value)}
                        />
                        <button className="btnSendMsg" id="sendMsgBtn" onClick={onSendMessageClick}>
                            <i className="fa fa-paper-plane">
                                <FontAwesomeIcon icon="fa-solid fa-paper-plane" />
                            </i>
                        </button>
                    </div>
                ) : (
                    <div className="block_ui_container">
                        <span>
                            You have blocked messages and calls from this account. You will not be able to text or call each other
                            in this chat
                        </span>
                        <button onClick={unBlock}>Unblock</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatContent;

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
