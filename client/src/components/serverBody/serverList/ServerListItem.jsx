import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsHaveAdminPermission, setServerOwner, setServerSelect } from '../../../store/reducers/serverReducer';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import app from '../../../configs/firebase';
import axiosInstance from '../../../configs/axiosConfig';

function ServerListItem(props) {
    const dispatch = useDispatch();
    const [isSelected, setIsSelected] = useState(false);
    const { serverSelect } = useSelector((state) => state.persistedReducer.serverReducer);
    const { user } = useSelector((state) => state.persistedReducer.authReducer);

    const onClickServer = (e) => {
        if (!e.currentTarget.classList.contains('selected')) {
            setIsSelected(true);
            for (let index = 0; index < e.currentTarget.parentNode.children.length; index++) {
                e.currentTarget.parentNode.children[index].classList.remove('selected');
            }
            e.currentTarget.classList.add('selected');
            dispatch(setServerSelect(props.serverData.serverId));
            const serverDocRef = doc(getFirestore(app), 'servers', props.serverData.serverId);
            getDoc(serverDocRef).then((server) => {
                dispatch(setServerOwner(server.data().owner));
            });
            const memberDocRef = doc(getFirestore(app), 'servers', props.serverData.serverId, 'members', user.user_id);
            getDoc(memberDocRef).then(async (member) => {
                const listRole = [...(await member.data().roles)];
                let flag = 100000;
                let highestRole;
                for (let i = 0; i < listRole.length - 1; i++) {
                    const roleDocRef = doc(getFirestore(app), 'servers', props.serverData.serverId, 'roles', listRole[i]);
                    const roleData = await getDoc(roleDocRef);
                    if ((await roleData.data().order) <= flag) {
                        highestRole = roleData.id;
                    }
                }
                const highestRoleAdPermRef = doc(
                    getFirestore(app),
                    'servers',
                    props.serverData.serverId,
                    'roles',
                    highestRole,
                    'role_permissions',
                    '0E0',
                );
                const data = await getDoc(highestRoleAdPermRef);
                const res = await data.data().enable;
                dispatch(setIsHaveAdminPermission(res));
            });
        }
    };

    useEffect(() => {
        setIsSelected(serverSelect === props.serverData.serverId);
    }, [serverSelect, props.serverData.serverId, user.user_id, dispatch]);

    return (
        <div className="server_list_item" onClick={onClickServer}>
            <div className={isSelected ? 'server_list_cursor selected' : 'server_list_cursor'}></div>
            <img src={props.serverData.serverImg}></img>
        </div>
    );
}

export default ServerListItem;
