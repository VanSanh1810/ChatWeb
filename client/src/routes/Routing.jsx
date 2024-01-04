import React from 'react';
import { HashRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import MainScreen from '../screens/MainScreen';
import AuthScreen from '../screens/AuthScreen';
import NotFound from '../components/notFound/NotFound';
import Private from './Private';
import DMCallScreen from '../screens/DMCallScreen';
import { ChatSocketProvider } from '../contexts/ChatSocketContext';
import { SocketIOProvider } from '../contexts/SocketIOContext';

function Routing() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AuthScreen />} />
                <Route
                    path="/main"
                    element={
                        <Private>
                            <SocketIOProvider>
                                <ChatSocketProvider>
                                    <MainScreen />
                                </ChatSocketProvider>
                            </SocketIOProvider>
                        </Private>
                    }
                />
                <Route
                    path="/dmcall/ROOM/:slug"
                    element={
                        <Private>
                            <DMCallScreen />
                        </Private>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Routing;
