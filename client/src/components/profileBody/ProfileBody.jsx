import React, {useEffect, useState} from 'react';
import ProfileContent from './profileContent/ProfileContent';
import ProfileReq from './profileReq/ProfileReq';
import ProfileModal from './profileContent/profileModal/ProfileModal';

const ProfileBody = () => {
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [modalType, setModalType] = useState(true); // true : change profile // false : change password

    const showModal = (modalType) => {
        setShowProfileModal(true);
        setModalType(modalType);
        //console.log(showProfileModal);
    };

    const closeModal = () => {
        setShowProfileModal(false);
        //console.log(showProfileModal);
    };

    return (
        <div className="main__chatbody">
            <ProfileContent showModal={showModal} />
            <ProfileReq />
            { showProfileModal ? <ProfileModal modalType={modalType} closeModal={closeModal}/> : null }
        </div>
    );
}

export default ProfileBody;
