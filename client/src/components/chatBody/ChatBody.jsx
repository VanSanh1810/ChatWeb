import React, { useEffect, useState } from 'react';
import './chatBody.css';
import ChatList from './chatList/ChatList';
import ChatContent from './chatContent/ChatContent';
import UserProfile from './userProfile/UserProfile';

function ChatBody(props) {
    const [togleChatProfile, seTogleChatProfile] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    return (
        <div className="main__chatbody">
            <ChatList />
            <ChatContent
                togleChatProfile={() => seTogleChatProfile(!togleChatProfile)}
                isBlocked={isBlocked}
                setIsBlocked={setIsBlocked}
            />
            {togleChatProfile ? <UserProfile isBlocked={isBlocked} setIsBlocked={setIsBlocked} /> : null}
        </div>
    );
}

export default ChatBody;
