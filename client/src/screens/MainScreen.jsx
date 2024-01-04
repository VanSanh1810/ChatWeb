import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Nav from '../components/nav/Nav';
import ChatBody from '../components/chatBody/ChatBody';
import { useSelector } from 'react-redux';
import { pages } from '../store/reducers/pageReducer';
import ProfileBody from '../components/profileBody/ProfileBody';
import NotifyBody from '../components/notifyBody/NotifyBody';
import SearchBody from '../components/searchBody/SearchBody';
import GameBody from '../components/gameBody/GameBody';
import { setPage } from '../store/reducers/pageReducer';
import { ToastContainer, toast } from 'react-toastify';
import { toastType } from '../store/reducers/toastReducer';
import 'react-toastify/dist/ReactToastify.css';
import MediaView from '../components/mediaView/MediaView';
import DMCallNotify from '../components/dmCallNotify/DMCallNotify';
import ServerBody from '../components/serverBody/ServerBody';
import URLScanner from '../components/urlScanner/URLScanner';
import { setURL } from '../store/reducers/urlScannerReducer';

const MainScreen = () => {
    const dispatch = useDispatch();
    const { pageToken } = useSelector((state) => state.persistedReducer.pageReducer);
    const { toastState } = useSelector((state) => state.persistedReducer.toastReducer);
    const { selectedViewMedia } = useSelector((state) => state.persistedReducer.chatReducer);
    const { inCommingDMCall } = useSelector((state) => state.persistedReducer.dmMessNotifyReducer);
    const { _url } = useSelector((state) => state.persistedReducer.urlScannerReducer);

    let bodyComponent;
    if (pageToken === pages.main) bodyComponent = <ChatBody />;
    else if (pageToken === pages.profile) bodyComponent = <ProfileBody />;
    else if (pageToken === pages.notify) bodyComponent = <NotifyBody />;
    else if (pageToken === pages.games) bodyComponent = <GameBody />;
    else if (pageToken === pages.search) bodyComponent = <SearchBody />;
    else if (pageToken === pages.server) bodyComponent = <ServerBody />;
    // if (pageToken === pages.main) bodyComponent = <ChatBody chatSocket={socket} />;
    // else if (pageToken === pages.profile) bodyComponent = <ProfileBody chatSocket={socket} />;
    // else if (pageToken === pages.notify) bodyComponent = <NotifyBody chatSocket={socket} />;
    // else if (pageToken === pages.games) bodyComponent = <GameBody chatSocket={socket} />;
    // else if (pageToken === pages.search) bodyComponent = <SearchBody chatSocket={socket} />;
    // else if (pageToken === pages.server) bodyComponent = <ServerBody chatSocket={socket} />;

    useEffect(() => {
        const notify = () => {
            switch (toastState.Tstate) {
                case toastType.info:
                    toast.info(toastState.Tmessage, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                    break;
                case toastType.success:
                    toast.success(toastState.Tmessage, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                    break;
                case toastType.warning:
                    toast.warn(toastState.Tmessage, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                    break;
                case toastType.error:
                    toast.error(toastState.Tmessage, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                    break;
                case toastType.default:
                    toast(toastState.Tmessage, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'light',
                    });
                    break;
                default:
                    break;
            }
        };
        notify();
    }, [toastState]);

    const setPages1 = (page) => {
        dispatch(setPage(page));
    };
    return (
        <>
            <div className="__main">
                <Nav setPagess={setPages1} />
                {bodyComponent}
                <ToastContainer style={{ fontFamily: "'Roboto', sans-serif" }} />
            </div>
            {selectedViewMedia.mediaURL ? <MediaView /> : null}
            {_url ? <URLScanner onCloseModal={() => dispatch(setURL(null))} /> : null}
            {inCommingDMCall.callFrom ? <DMCallNotify /> : null}
        </>
    );
};

export default MainScreen;
