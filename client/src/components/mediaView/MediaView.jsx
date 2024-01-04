import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './mediaView.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { clearSelectedViewMedia } from '../../store/reducers/chatReducer';

function MediaView() {
    const dispatch = useDispatch();
    const { selectedViewMedia } = useSelector((state) => state.persistedReducer.chatReducer);

    const closeMediaView = () => {
        dispatch(clearSelectedViewMedia());
    };

    return (
        <div className="media_view_main">
            <div className="media_view_close_contain">
                {/* <a href={selectedViewMedia.mediaURL} download={true}>
                    <i style={{fontSize: "22px"}}>
                        <FontAwesomeIcon icon="fa-solid fa-download" />
                    </i>
                </a> */}
                <i onClick={closeMediaView}>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" />
                </i>
            </div>
            <div className="media_view">
                {selectedViewMedia.type === 'image' ? (
                    <img src={selectedViewMedia.mediaURL}></img>
                ) : (
                    <video controls>
                        <source src={selectedViewMedia.mediaURL} type={'video/mp4'} />
                    </video>
                )}
            </div>
        </div>
    );
}

export default MediaView;
