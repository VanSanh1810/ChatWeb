import React, { useEffect, useState } from 'react';
import './messageItem.css';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../../../configs/firebase';
import { useDispatch } from 'react-redux';
import { setURL } from '../../../../store/reducers/urlScannerReducer';

function MessageItem(props) {
    const dispatch = useDispatch();
    const [uData, setUData] = useState();
    useEffect(() => {
        const useDocRef = doc(getFirestore(app), 'users', props.messData.sendBy);
        getDoc(useDocRef).then(async (doc) => {
            setUData({ name: await doc.data().name, img: await doc.data().img });
        });
    }, [props.messData.sendBy]);

    const handleLinkClick = (e, link) => {
        e.preventDefault();
        dispatch(setURL(link));
    };

    const textWithLinks = props.messData?.msg.split(' ').map((word, index) => {
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
                        <div className="message_item_content_data">
                            <p>{textWithLinks}</p>
                        </div>
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
                        <div className="message_item_content_data me">
                            <p>{textWithLinks}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default MessageItem;
