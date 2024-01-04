import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import app from '../../../../configs/firebase';
import { getStorage, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { updatePassword, getAuth } from 'firebase/auth';
import './profileModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../configs/axiosConfig';
import { toastType } from '../../../../store/reducers/toastReducer';
import { setToastState } from '../../../../store/reducers/toastReducer';

function ProfileModal(props) {
    const dispatch = useDispatch();

    // change profile function
    const storage = getStorage(app);
    const { user, userToken } = useSelector((state) => state.persistedReducer.authReducer);
    const [loading, setLoading] = useState(false);

    const [previewImg, setPreviewImg] = useState('');
    const imgSelectHandler = (e) => {
        if (e.target.files.lenght !== 0) {
            setPreviewImg(URL.createObjectURL(e.target.files[0]));
        }
    };

    const uploadFile = () => {
        document.getElementById('proModal_selectImg').click();
    };

    const saveProfileChange = async () => {
        setLoading(true);
        const newProImg = document.getElementById('proModal_selectImg');
        const newProName = document.getElementById('proModal_Name');
        if (newProImg.files.length !== 0 || newProName.value.trim() !== '') {
            if (newProImg.files.length !== 0) {
                let fileItem = await newProImg.files[0];
                let storageRef = await ref(storage, `userStorage/${user.user_id}/${user.user_id}`);
                try {
                    await deleteObject(storageRef);
                } catch (error) {
                    console.log(error);
                }
                let uploadResult = await uploadBytes(storageRef, fileItem);
            }
            try {
                const { data } = await axiosInstance.put('/api/setUser', {
                    idToken: userToken,
                    newName: newProName.value.trim(),
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Change profile successfuly !' }));
            } catch (error) {
                console.log(error);
            }
        }
        setLoading(false);
        props.closeModal();
    };
    // Change password function
    const [passFieldErr, setPassFieldErr] = useState('');

    const handleKeyDown = (event) => {
        if (event.keyCode === 32) {
            event.preventDefault(); // Ngăn chặn sự kiện mặc định của phím cách
        }
    };

    const savePasswordChange = () => {
        setLoading(true);
        const inpPass = document.getElementById('proModal_pass');
        const inpPassData = inpPass.value.trim();
        const reinpPass = document.getElementById('proModal_repass');
        const reinpPassData = reinpPass.value.trim();
        if (inpPassData) {
            if (inpPassData.length >= 6) {
                if (inpPassData === reinpPassData) {
                    updatePassword(getAuth(app).currentUser, inpPassData).then(() => {
                        dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Change password successfuly !' }));
                        setPassFieldErr('');
                    });
                } else {
                    setPassFieldErr('Passwords do not match !');
                }
            } else {
                setPassFieldErr('Password must be at least 6 characters !');
            }
        } else {
            setPassFieldErr('Password must not be empty !');
        }
        setLoading(false);
        props.closeModal();
    };

    return (
        <>
            <div className="proModal__main">
                <div className="proModal__box">
                    <div className="proModal_form">
                        <div className="proModal__close_contain">
                            <h1>{props.modalType ? 'Change Your Profile' : 'Change Password'}</h1>
                            <i onClick={props.closeModal}>
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                            </i>
                        </div>
                        <div className="proModal__input_contain">
                            {props.modalType ? (
                                <>
                                    <input id="proModal_Name" type="text" placeholder="Enter your new name" />
                                    <div className="proModal_imgContain">
                                        <button onClick={() => uploadFile()}>Upload new avatar</button>
                                        <input
                                            id="proModal_selectImg"
                                            name=""
                                            type="file"
                                            hidden
                                            accept=".jpg, .png"
                                            onChange={(e) => imgSelectHandler(e)}
                                        />
                                        <img
                                            style={{ width: '50px', height: '50px' }}
                                            id="proModal_imgPreview"
                                            src={
                                                previewImg
                                                    ? previewImg
                                                    : 'https://icons.veryicon.com/png/o/internet--web/prejudice/user-128.png'
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <input
                                        id="proModal_pass"
                                        type="password"
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter your new password"
                                        required
                                    />
                                    <input
                                        id="proModal_repass"
                                        type="password"
                                        onKeyDown={handleKeyDown}
                                        placeholder="Verify password"
                                        required
                                    />
                                    <span>{passFieldErr}</span>
                                </>
                            )}
                        </div>
                        <div className="proModal__action_contain">
                            <button onClick={props.modalType ? () => saveProfileChange() : () => savePasswordChange()}>
                                {loading ? 'Loading..' : 'Save'}
                            </button>
                            <button onClick={props.closeModal}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProfileModal;
