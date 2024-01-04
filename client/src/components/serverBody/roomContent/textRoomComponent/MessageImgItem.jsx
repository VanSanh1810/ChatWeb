import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedViewMedia } from '../../../../store/reducers/chatReducer';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function MessageImgItem(props) {
    const dispatch = useDispatch();
    const [mediaDataWithExtension, setMediaDataWithExtension] = useState([]);

    const [uData, setUData] = useState();
    useEffect(() => {
        const useDocRef = doc(getFirestore(app), 'users', props.messData.sendBy);
        getDoc(useDocRef).then(async (doc) => {
            setUData({ name: await doc.data().name, img: await doc.data().img });
        });
    }, [props.messData.sendBy]);

    useEffect(() => {
        const getDWE = async () => {
            let tempList = await Promise.all(
                props.messData.mediaData.map(async (media, index) => {
                    let type = await checkFileType(media);
                    return { type: type, media: media };
                }),
            );
            setMediaDataWithExtension([...tempList]);
        };
        getDWE();
    }, [props.messData.mediaData]);

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

    const countMediaData = (mediaData) => {
        if (mediaData.length === 1) {
            return '';
        }
        if (mediaData.length === 2) {
            return 'two_item';
        }
        if (mediaData.length >= 3) {
            return 'three_item';
        }
    };

    const setMediaViewState = (media) => {
        dispatch(setSelectedViewMedia({ mediaURL: media.media, type: media.type }));
    };

    const downloadOtherFile = (link, name) => {
        const aRef = document.createElement('a');
        aRef.setAttribute('href', link); // Thiết lập thuộc tính 'href'
        aRef.setAttribute('download', name); // Thiết lập thuộc tính 'download'
        aRef.click();
    };
    function getFileNameFromDownloadURL(downloadURL) {
        // Sử dụng các phương thức xử lý chuỗi để lấy tên tệp
        const splitURL = downloadURL.split('%2F'); // Phân chia URL bằng phần trở về %2F (dấu gạch chéo)
        const fileNameWithQuery = splitURL[splitURL.length - 1]; // Lấy phần cuối cùng sau khi đã phân chia
        const fileName = decodeURIComponent(fileNameWithQuery.split('?')[0]); // Loại bỏ phần truy vấn (nếu có)

        return fileName.slice(13);
    }

    return (
        <>
            {props.sender === 'other' ? (
                <div className="message_item">
                    <img
                        style={props.messData?.style !== 'last' ? { visibility: 'hidden' } : null}
                        className="message_item_avt"
                        src={uData?.img}
                    ></img>
                    <div className="message_item_content">
                        {props.messData?.isFirst ? <p className="message_item_content_sender">{uData?.name}</p> : null}
                        {mediaDataWithExtension.length > 0 ? (
                            <div
                                style={{ zIndex: 2 }}
                                className={`media_data_container ${countMediaData(mediaDataWithExtension)}`}
                            >
                                {mediaDataWithExtension.map((media, index) => {
                                    if (media.type === 'image') {
                                        return <img key={index} src={media.media} onClick={() => setMediaViewState(media)} />;
                                    } else if (media.type === 'video') {
                                        return (
                                            <video key={index} width={140} onClick={() => setMediaViewState(media)}>
                                                <source src={media.media} type={'video/mp4'} />
                                            </video>
                                        );
                                    } else {
                                        return (
                                            <div
                                                key={index}
                                                className="unsupType"
                                                onClick={() =>
                                                    downloadOtherFile(media.media, getFileNameFromDownloadURL(media.media))
                                                }
                                            >
                                                <FontAwesomeIcon icon="fa-solid fa-file-lines" />
                                                <span>{getFileNameFromDownloadURL(media.media)}</span>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="message_item me">
                    <img
                        style={props.messData?.style !== 'last' ? { visibility: 'hidden' } : null}
                        className="message_item_avt"
                        src={uData?.img}
                    ></img>
                    <div className="message_item_content me">
                        {mediaDataWithExtension.length > 0 ? (
                            <div
                                style={{ background: 'none' }}
                                className={`media_data_container ${countMediaData(mediaDataWithExtension)}`}
                            >
                                {mediaDataWithExtension.map((media, index) => {
                                    if (media.type === 'image') {
                                        return <img key={index} src={media.media} onClick={() => setMediaViewState(media)} />;
                                    } else if (media.type === 'video') {
                                        return (
                                            <video key={index} width={140} onClick={() => setMediaViewState(media)}>
                                                <source src={media.media} type={'video/mp4'} />
                                            </video>
                                        );
                                    } else {
                                        return (
                                            <div
                                                key={index}
                                                className="unsupType"
                                                onClick={() =>
                                                    downloadOtherFile(media.media, getFileNameFromDownloadURL(media.media))
                                                }
                                            >
                                                <FontAwesomeIcon icon="fa-solid fa-file-lines" />
                                                <span>{getFileNameFromDownloadURL(media.media)}</span>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}

export default MessageImgItem;
