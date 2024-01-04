import React, { useEffect, useState } from 'react';
import Avatar from '../chatList/Avatar';
import { useDispatch } from 'react-redux';
import { setSelectedViewMedia } from '../../../store/reducers/chatReducer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setURL } from '../../../store/reducers/urlScannerReducer';

function ChatItem(props) {
    const dispatch = useDispatch();
    const [mediaDataWithExtension, setMediaDataWithExtension] = useState([]);
    useEffect(() => {
        const getDWE = async () => {
            let tempList = await Promise.all(
                props.mediaData.map(async (media, index) => {
                    let type = checkFileType(media);
                    return { type: type, media: media };
                }),
            );
            setMediaDataWithExtension([...tempList]);
        };
        getDWE();
    }, [props.mediaData]);

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

    const calculateTimeDifference = (referenceTimestamp) => {
        // Lấy thời điểm hiện tại
        const currentTime = new Date().getTime();

        // Chênh lệch thời gian giữa thời điểm hiện tại và thời điểm mốc
        const timeDiff = currentTime - referenceTimestamp;

        // Chuyển đổi thời gian chênh lệch thành phút
        const minutesDiff = Math.floor(timeDiff / (60 * 1000));

        if (minutesDiff <= 5) {
            return `Just now`;
        } else if (minutesDiff < 60) {
            return `${minutesDiff} minutes ago`;
        } else if (minutesDiff < 24 * 60) {
            const hoursDiff = Math.floor(minutesDiff / 60);
            return `${hoursDiff} hours ago`;
        } else {
            // Format lại thời gian mốc thành ngày/giờ/phút
            const referenceDate = new Date(referenceTimestamp);
            const formattedDate = referenceDate.toLocaleString();

            return `${formattedDate}`;
        }
    };

    //https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/chatRoomStorage%2Ff2bd4138-67cd-4e1b-8c5f-6d8b8a2d66f4%2F1697012362455325335972_8553608168045365_1131057237152661700_n.mp4?alt=media&token=10a7e733-5a89-45af-8eb4-77dfc42384f9

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

    function getFileNameFromDownloadURL(downloadURL) {
        // Sử dụng các phương thức xử lý chuỗi để lấy tên tệp
        const splitURL = downloadURL.split('%2F'); // Phân chia URL bằng phần trở về %2F (dấu gạch chéo)
        const fileNameWithQuery = splitURL[splitURL.length - 1]; // Lấy phần cuối cùng sau khi đã phân chia
        const fileName = decodeURIComponent(fileNameWithQuery.split('?')[0]); // Loại bỏ phần truy vấn (nếu có)

        return fileName.slice(13);
    }

    const handleLinkClick = (e, link) => {
        e.preventDefault();
        dispatch(setURL(link));
    };

    const textWithLinks = props.msg?.split(' ').map((word, index) => {
        if (word.startsWith('http://') || word.startsWith('https://')) {
            return (
                <a
                    key={index}
                    href={word}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => handleLinkClick(event, word)}
                >
                    {word}
                </a>
            );
        }
        return word + ' ';
    });

    const downloadOtherFile = (link, name) => {
        const aRef = document.createElement('a');
        aRef.setAttribute('href', link); // Thiết lập thuộc tính 'href'
        aRef.setAttribute('download', name); // Thiết lập thuộc tính 'download'
        aRef.click();
    };

    return (
        <>
            <div style={{ animationDelay: `0.8s` }} className={`chat__item ${props.user}`}>
                <div className="chat__meta">
                    <span>{calculateTimeDifference(props.sendAt)}</span>
                    {/* <span>Seen 1.03PM</span> */}
                </div>
                <div className="chat__item__content">
                    {props.msg ? (
                        <div className="chat__msg">
                            {props.type ? <FontAwesomeIcon icon="fa-solid fa-phone" /> : null}
                            {textWithLinks}
                        </div>
                    ) : null}
                    {mediaDataWithExtension.length > 0 ? (
                        <div className={`media_data_container ${countMediaData(mediaDataWithExtension)}`}>
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
                {/* <video width={200} controls>
                    <source src="https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/systemStorage%2FPLAYERUNKNOWN'S%20BATTLEGROUNDS%202023.08.27%20-%2012.40.34.07.DVR.1693115049601.mp4?alt=media&token=4fc9434f-5aa1-4d38-b2d1-f6905a53bcca" type={"video/mp4"}/>
                </video> */}
            </div>
        </>
    );
}

export default ChatItem;
