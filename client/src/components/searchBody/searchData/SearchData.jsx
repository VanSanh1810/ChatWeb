import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import axiosInstance from '../../../configs/axiosConfig';
import './searchData.css';

function SearchData(props) {
    //button state
    const reqBtnState = {
        addfriend: 'Add friend',
        unfriend: 'Unfriend',
        revokeReq: 'Revoke request',
        acceptReq: 'Accept request',
        rejectReq: 'Reject request',
        none: '',
    };
    const [blockButton, setBlockButton] = useState(false);
    const [reqBtn, setReqBtn] = useState(reqBtnState.none);

    ////////////////////////////////
    const [userData, setUserData] = useState('');
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const spanRef = useRef(null);
    const copyText = () => {
        if (spanRef.current) {
            const spanText = spanRef.current.innerText;
            const textArea = document.createElement('textarea');
            textArea.value = spanText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    const onBlockClick = async () => {
        const { data } = await axiosInstance.post('/api/userInterractAction', { idToken: userToken, targetId: props.data, action: blockButton ? 'unblock' : 'block' });
    };

    const onReqBtnClick = async () => {
        const { data } = await axiosInstance.post('/api/userInterractAction', { idToken: userToken, targetId: props.data, action: reqBtn});
    }

    useEffect(() => {
        const getDataFromSearchResult = async () => {
            try {
                const { data } = await axiosInstance.post('/api/getUserById', { idToken: userToken, targetId: props.data });
                setUserData(data);
                setBlockButton(data.inYourBlockList);
                if (data.inYourReqSendList) {
                    setReqBtn(reqBtnState.revokeReq);
                } else {
                    if (data.inYourReqResList) {
                        setReqBtn(reqBtnState.acceptReq);
                    } else {
                        if (data.inYourFriendList) {
                            setReqBtn(reqBtnState.unfriend);
                        } else {
                            setReqBtn(reqBtnState.addfriend);
                        }
                    }
                }
            } catch (error) {
                console.log(error.response.status);
            }
        };
        getDataFromSearchResult();
    });

    return (
        <>
            <div className="searchSuggest__data__main">
                <img src={userData.img} />
                <h1>{userData.name}</h1>
                <span ref={spanRef} onClick={copyText}>
                    {userData.userID}
                </span>
                <div className="req_btn_contain">
                    <button onClick={onReqBtnClick}>{reqBtn}</button>
                    <button onClick={onBlockClick}>{blockButton ? 'Unblock' : 'Block'}</button>
                </div>
            </div>
        </>
    );
}

export default SearchData;
