import React, { useRef, useState } from 'react';
import './serverCreateModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Loader2 from '../../../loader/Loader2';
import { getStorage, ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../../../../configs/firebase';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ServerCreateModal(props) {
    const storage = getStorage(app);
    const dispatch = useDispatch();

    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [previewImg, setPreviewImg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isJoined, setIsJoined] = useState(false);

    const imgInputClick = () => {
        const imgInput = document.getElementById('scsm_imgInput');
        imgInput.click();
    };

    const imgSelectHandler = (e) => {
        if (e.target.files.lenght !== 0) {
            setPreviewImg(URL.createObjectURL(e.target.files[0]));
        }
    };

    const inviteKeyRef = useRef();
    const onJoinServerClick = async (e) => {
        if (inviteKeyRef.current.value) {
            try {
                const { data } = await axiosInstance.post('api/server/joinServer', {
                    idToken: userToken,
                    inviteKey: inviteKeyRef.current.value,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: data }));
                props.closeModal(false);
            } catch (error) {
                console.log(error);
            }
        }
    };

    const onCreateServerClick = async (e) => {
        const newServerId = uuidv4();
        setIsLoading(true);
        const newSerImg = document.getElementById('scsm_imgInput');
        const newSerName = document.getElementById('scsm_serverName');
        if (newSerImg.files.length !== 0 && newSerName.value.trim() !== '') {
            if (newSerImg.files.length !== 0) {
                let fileItem = await newSerImg.files[0];
                let storageRef = ref(storage, `serverStorage/${newServerId}/serverProfileImg`);
                try {
                    await deleteObject(storageRef);
                } catch (error) {
                    console.log(error);
                }
                let uploadResult = await uploadBytes(storageRef, fileItem);
                let url = await getDownloadURL(uploadResult.ref);
                try {
                    const { data } = await axiosInstance.put('api/server/createServer', {
                        idToken: userToken,
                        newServerName: newSerName.value.trim(),
                        newServerId: newServerId,
                        newServerImg: url,
                    });
                    dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Server create successfuly !' }));
                    props.closeModal(false);
                } catch (error) {
                    console.log(error);
                }
            } else {
                dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'Please fill all value !' }));
            }
        } else {
            dispatch(setToastState({ Tstate: toastType.error, Tmessage: 'Please fill all value !' }));
        }
        setIsLoading(false);
        props.closeModal(false);
    };
    return (
        <div className="server_createServer_Modal">
            <div className="server_createServer_Modal_box">
                <div className="server_createServer_Modal_controls">
                    <button onClick={() => props.closeModal(false)}>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                </div>
                {!isJoined ? (
                    <>
                        <h1>CREATE YOUR SERVER</h1>
                        <p>
                            Personalize your server experience by setting your server name and picture. These can be changed later
                        </p>
                        <div className="server_createServer_Modal_imgInput">
                            <input
                                id="scsm_imgInput"
                                hidden
                                type="file"
                                accept=".jpg, .jpeg, .png, .gif"
                                onChange={imgSelectHandler}
                            ></input>
                            <img
                                id="scsm_imgReview"
                                src={
                                    previewImg
                                        ? previewImg
                                        : 'https://t4.ftcdn.net/jpg/04/81/13/43/360_F_481134373_0W4kg2yKeBRHNEklk4F9UXtGHdub3tYk.jpg'
                                }
                                onClick={imgInputClick}
                            ></img>
                        </div>
                        <input id="scsm_serverName" type="text" placeholder="Server name *" required></input>
                        <button id="scsm_createBtn" onClick={onCreateServerClick}>
                            {isLoading ? <Loader2 /> : 'Create Server'}
                        </button>
                        <p>
                            or{' '}
                            <b className="join_server_ref_link" onClick={() => setIsJoined(true)}>
                                join existing server
                            </b>
                        </p>
                    </>
                ) : (
                    <>
                        <h1 style={{ marginBottom: '20px' }}>JOIN EXISTING SERVER</h1>
                        <input
                            id="scsm_serverName"
                            ref={inviteKeyRef}
                            type="text"
                            placeholder="Invite key *"
                            required
                            autoCorrect={false}
                        ></input>
                        <button id="scsm_createBtn" onClick={onJoinServerClick}>
                            {isLoading ? <Loader2 /> : 'Join a server'}
                        </button>
                        <p>
                            or{' '}
                            <b className="join_server_ref_link" onClick={() => setIsJoined(false)}>
                                creating new server
                            </b>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ServerCreateModal;
