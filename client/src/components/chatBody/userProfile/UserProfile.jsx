import React, { useEffect, useState, useMemo } from 'react';
import './userProfile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getFirestore, query, collection, limit, orderBy, getDocs, startAfter, doc, getDoc } from 'firebase/firestore';
import app from '../../../configs/firebase';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedViewMedia } from '../../../store/reducers/chatReducer';
import axiosInstance from '../../../configs/axiosConfig';

function UserProfile(props) {
    const dispatch = useDispatch();

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [isPASOpen, setIsPASOpen] = useState(false);
    const { selectedChatData } = useSelector((state) => state.persistedReducer.chatReducer);
    const [mediaArray, setMediaArray] = useState([]);
    const [lastMediaRef, setLastMediaRef] = useState();

    const memoizedMediaArray = useMemo(() => mediaArray, [mediaArray]);

    const [uData, setUData] = useState();

    useEffect(() => {
        const getChatMedia = async () => {
            setMediaArray((mediaArray) => []);
            const first = query(
                collection(getFirestore(app), 'chatLists', selectedChatData.chatId, 'media'),
                orderBy('sendAt', 'desc'),
                limit(27),
            );
            const documentSnapshots = await getDocs(first);
            let mediaArr = [];
            await Promise.all(
                documentSnapshots.docs.map(async (media, index) => {
                    let url = await media.data().media;
                    mediaArr.push({
                        media: url,
                        type: checkFileType(url),
                    });
                    return index;
                }),
            );
            setMediaArray((mediaArray) => [...mediaArray, ...mediaArr]);
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastMediaRef(lastVisible);
        };
        getChatMedia();
    }, [selectedChatData]);

    useEffect(() => {
        const userDocRef = doc(getFirestore(app), 'users', selectedChatData.userChatId);
        getDoc(userDocRef).then((doc) => {
            setUData(doc.data());
        });
    }, [selectedChatData.userChatId]);

    const checkFileType = (url) => {
        const extension = getFileExtension(url);
        if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif') {
            return 'image';
        } else if (extension === 'mp4') {
            return 'video';
        } else if (extension === 'pdf') {
            return 'pdf';
        } else if (extension === 'doc' || extension === 'docx') {
            return 'document';
        } else {
            return 'unknown';
        }
    };

    const getFileExtension = (url) => {
        const segments = url.split('.');
        if (segments.length === 0) {
            return null; // Không tìm thấy extension
        }
        return segments[segments.length - 1].toLowerCase().substring(0, 3); // Lấy extension và chuyển thành chữ thường
    };

    const toggleInfo = (e) => {
        e.currentTarget.parentNode.classList.toggle('open');
        setIsMediaOpen(!isMediaOpen);
    };

    const togglePAS = (e) => {
        e.currentTarget.parentNode.classList.toggle('open');
        setIsPASOpen(!isPASOpen);
    };

    const setMediaViewState = (media) => {
        dispatch(setSelectedViewMedia({ mediaURL: media.media, type: media.type }));
    };

    const onScrollToBottom = async (e) => {
        if (isScrolledToBottom(e.currentTarget)) {
            const first = query(
                collection(getFirestore(app), 'chatLists', selectedChatData.chatId, 'media'),
                orderBy('sendAt', 'desc'),
                limit(9),
                startAfter(lastMediaRef),
            );
            const documentSnapshots = await getDocs(first);
            let mediaArr = [];
            await Promise.all(
                documentSnapshots.docs.map(async (media, index) => {
                    let url = await media.data().media;
                    mediaArr.push({
                        media: url,
                        type: checkFileType(url),
                    });
                    return index;
                }),
            );
            setMediaArray((mediaArray) => [...mediaArray, ...mediaArr]);
            // Get the last visible document
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastMediaRef(lastVisible);
        }
    };

    function isScrolledToBottom(imageContainer) {
        const containerHeight = imageContainer.clientHeight;
        const scrollPosition = imageContainer.scrollTop;
        const scrollHeight = imageContainer.scrollHeight;
        return containerHeight + scrollPosition >= scrollHeight;
    }

    function toggleBlock() {
        axiosInstance
            .post('/api/userInterractAction', {
                idToken: userToken,
                targetId: selectedChatData.userChatId,
                action: props.isBlocked ? 'unblock' : 'block',
            })
            .then(() => {
                props.setIsBlocked(!props.isBlocked);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    function getFileNameFromDownloadURL(downloadURL) {
        // Sử dụng các phương thức xử lý chuỗi để lấy tên tệp
        const splitURL = downloadURL.split('%2F'); // Phân chia URL bằng phần trở về %2F (dấu gạch chéo)
        const fileNameWithQuery = splitURL[splitURL.length - 1]; // Lấy phần cuối cùng sau khi đã phân chia
        const fileName = decodeURIComponent(fileNameWithQuery.split('?')[0]); // Loại bỏ phần truy vấn (nếu có)

        return fileName.slice(13);
    }

    const downloadOtherFile = (link, name) => {
        const aRef = document.createElement('a');
        aRef.setAttribute('href', link); // Thiết lập thuộc tính 'href'
        aRef.setAttribute('download', name); // Thiết lập thuộc tính 'download'
        aRef.click();
    };

    return (
        <div className="main__userprofile">
            <div className="profile__card user__profile__image">
                <div className="profile__image">
                    <img src={uData?.img} />
                </div>
                <h4>{uData?.name}</h4>
                <p>{uData?.userID}</p>
            </div>
            <div className="profile__card">
                <div className="card__header" onClick={toggleInfo}>
                    <h4>Media</h4>
                    <i>
                        <FontAwesomeIcon icon="fa-solid fa-angle-down" />
                    </i>
                </div>
                <div className="card__content" onScroll={onScrollToBottom}>
                    {memoizedMediaArray.map((media, index) => {
                        if (media.type === 'image') {
                            return <img key={index} src={media.media} onClick={() => setMediaViewState(media)} />;
                        } else if (media.type === 'video') {
                            return (
                                <video key={index} onClick={() => setMediaViewState(media)}>
                                    <source src={media.media} type={'video/mp4'} />
                                </video>
                            );
                        } else {
                            return (
                                <div
                                    key={index}
                                    className="unsupType"
                                    onClick={() => downloadOtherFile(media.media, getFileNameFromDownloadURL(media.media))}
                                >
                                    <FontAwesomeIcon icon="fa-solid fa-file-lines" />
                                    <span>{getFileNameFromDownloadURL(media.media)}</span>
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
            <div className="profile__card">
                <div className="card__header" onClick={togglePAS}>
                    <h4>Privacy and support</h4>
                    <i>
                        <FontAwesomeIcon icon="fa-solid fa-angle-down" />
                    </i>
                </div>
                {isPASOpen ? (
                    <div className="card__content_opt">
                        <button onClick={toggleBlock}>
                            {!props.isBlocked ? (
                                <>
                                    <FontAwesomeIcon icon="fa-solid fa-ban" />
                                    <span>Block</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fa-solid fa-circle-minus" />
                                    <span>UnBlock</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default UserProfile;
