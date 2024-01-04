import React, { useRef, useState } from 'react';
import './serverCreateChannelModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from '../../../_switch/Switch';
import UserAndRoleToSelect from '../userAndRoleToSelect/UserAndRoleToSelect';
import axiosInstance from '../../../../configs/axiosConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setToastState, toastType } from '../../../../store/reducers/toastReducer';

function ServerCreateChannelModal(props) {
    const dispatch = useDispatch();
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);

    const [isPrivate, setIsPrivate] = useState(false);
    const [isCreateEnable, setIsCreateEnable] = useState(false);
    const [isSelectRolenUserModal, setIsSelectRolenUserModal] = useState(false);
    const [newCnName, setNewCnName] = useState();
    const newChannelName = useRef();

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const checkChannelNameIsHaveData = () => {
        if (newChannelName.current.value.trim() !== '') {
            setIsCreateEnable(true);
            setNewCnName(newChannelName.current.value.trim());
        } else {
            setIsCreateEnable(false);
            setNewCnName('');
        }
    };

    const click1 = () => {
        if (isPrivate) {
            setIsSelectRolenUserModal(true);
        } else {
            try {
                axiosInstance.put('api/server/createChannel', {
                    idToken: userToken,
                    newChannelName: newChannelName.current.value,
                    isPrivate: false,
                    roleAndData: [],
                    serverId: serverSelect,
                });
                dispatch(setToastState({ Tstate: toastType.success, Tmessage: 'Create channel successfuly !' }));
                props.closeModal();
            } catch (error) {
                console.log(error);
            }
        }
    };

    return (
        <div className="serverModal_main">
            <div className="serverModal_box">
                <div className="serverModal_box_close">
                    <h1>{!isSelectRolenUserModal ? 'Create channel' : 'Add users or roles'}</h1>
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={() => props.closeModal()} />
                </div>
                {!isSelectRolenUserModal ? (
                    <>
                        <div className="serverModal_box_input">
                            <label>Channel Name</label>
                            <input
                                ref={newChannelName}
                                type="text"
                                spellCheck="false"
                                placeholder="Enter new channel name"
                                onChange={checkChannelNameIsHaveData}
                            ></input>
                            <div className="serverCreateChannelModal_privateChannel_contain">
                                <h2>Private channel</h2>
                                <Switch defautData={isPrivate} switchToggleData={() => setIsPrivate(!isPrivate)} />
                            </div>
                            <p>
                                If a channel is set to private, only designated members or roles can have access to this channel
                            </p>
                        </div>
                        <div className="serverModal_box_actBtn">
                            <button onClick={() => props.closeModal()}>Close</button>
                            {isCreateEnable ? <button onClick={click1}>{isPrivate ? 'Next' : 'Create'}</button> : null}
                        </div>
                    </>
                ) : (
                    <UserAndRoleToSelect
                        newChannelName={newCnName}
                        goBack={() => setIsSelectRolenUserModal(false)}
                        closeModal={props.closeModal}
                    />
                )}
            </div>
        </div>
    );
}

export default ServerCreateChannelModal;
