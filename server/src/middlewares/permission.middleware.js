require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');

class PermissionMiddleware {
    async CheckChannelPermission(req, res, next) {
        const decodedIdToken = await req.body.decodedIdToken;
        const serverId = await req.body.serverId;
        const channelId = await req.body.channelId;
        const permId = await req.body.permId; // only used the last two characters to define permissions type

        const stackTypeFlags = (await req.body.stackTypeFlags) ? true : false; // true if this is the middleware stack and false if it is the endpoint api

        const serverDocRef = admin.db.collection('servers').doc(serverId);
        const channelDocRef = serverDocRef.collection('chanels').doc(channelId);

        const userData = await serverDocRef.collection('members').doc(decodedIdToken.user_id).get();
        let userRoles = [...(await userData.data().roles)];
        userRoles.push('0');

        channelDocRef
            .collection('members')
            .doc(decodedIdToken.user_id)
            .get()
            .then((doc) => {
                if (doc.exists) {
                    channelDocRef
                        .collection('members')
                        .doc(decodedIdToken.user_id)
                        .collection('channel_member_permissions')
                        .doc(`1${permId}`)
                        .get()
                        .then(async (permDoc) => {
                            const enable = await permDoc.data().enable;
                            switch (enable) {
                                case 'unset':
                                    //Check channel_role_permissions
                                    channelDocRef
                                        .collection('roles')
                                        .get()
                                        .then((roles) => {
                                            let channelRoleList = [];
                                            Promise.all(
                                                roles.docs.map(async (role, index) => {
                                                    channelRoleList.push(role.id);
                                                    return index;
                                                }),
                                            ).then(() => {
                                                let processListRole = [];
                                                Promise.all(
                                                    userRoles.map(async (role, index) => {
                                                        if (channelRoleList.indexOf(role) !== -1) {
                                                            // found in channelRoleList
                                                            processListRole.push(role);
                                                        }
                                                        return index;
                                                    }),
                                                ).then(async () => {
                                                    if (processListRole.length > 0) {
                                                        let highOrderRole;
                                                        if (processListRole.length > 1) {
                                                            let flag = 100000;
                                                            for (let i = 0; i < processListRole.length - 1; i++) {
                                                                //find the highest priority role
                                                                const data = await serverDocRef
                                                                    .collection('roles')
                                                                    .doc(processListRole[i])
                                                                    .get();
                                                                console.log(processListRole[i]);
                                                                if (data.data().order <= flag) {
                                                                    highOrderRole = processListRole[i];
                                                                    flag = data.data().order;
                                                                }
                                                            }
                                                        } else {
                                                            highOrderRole = processListRole[0];
                                                        }
                                                        const enableResult = await channelDocRef
                                                            .collection('roles')
                                                            .doc(highOrderRole)
                                                            .collection('channel_role_permissions')
                                                            .doc(`1${permId}`)
                                                            .get();
                                                        const result = await enableResult.data().enable;
                                                        switch (result) {
                                                            case 'unset':
                                                                //Check role_permissions
                                                                serverDocRef
                                                                    .collection('roles')
                                                                    .doc(highOrderRole)
                                                                    .collection('role_permissions')
                                                                    .doc(`0${permId}`)
                                                                    .get()
                                                                    .then(async (perm) => {
                                                                        if (stackTypeFlags) {
                                                                            if (await perm.data().enable) {
                                                                                next();
                                                                            } else {
                                                                                res.status(401).send(
                                                                                    'You are not allowed to process this function',
                                                                                );
                                                                            }
                                                                        } else {
                                                                            res.status(200).send({
                                                                                enable: await perm.data().enable,
                                                                            });
                                                                        }
                                                                    })
                                                                    .catch((err) => {
                                                                        res.status(500).send(
                                                                            'Internal Server Error!' + err.message,
                                                                        );
                                                                    });
                                                                break;
                                                            case true:
                                                                if (stackTypeFlags) {
                                                                    next();
                                                                } else {
                                                                    res.status(200).send({ enable: result });
                                                                }
                                                                break;
                                                            case false:
                                                                if (stackTypeFlags) {
                                                                    res.status(401).send(
                                                                        'You are not allowed to process this function',
                                                                    );
                                                                } else {
                                                                    res.status(200).send({ enable: result });
                                                                }
                                                                break;
                                                        }
                                                    } else {
                                                        res.status(500).send('How ?????');
                                                    }
                                                });
                                            });
                                        })
                                        .catch((error) => {
                                            res.status(500).send('Internal Server Error!' + err.message);
                                        });
                                    break;
                                case true:
                                    if (stackTypeFlags) {
                                        next();
                                    } else {
                                        res.status(200).send({ enable: enable });
                                    }
                                    break;
                                case false:
                                    if (stackTypeFlags) {
                                        res.status(401).send('You are not allowed to process this function');
                                    } else {
                                        res.status(200).send({ enable: enable });
                                    }
                                    break;
                            }
                        });
                } else {
                    //Check channel_role_permissions
                    channelDocRef
                        .collection('roles')
                        .get()
                        .then((roles) => {
                            let channelRoleList = [];
                            Promise.all(
                                roles.docs.map(async (role, index) => {
                                    channelRoleList.push(role.id);
                                    return index;
                                }),
                            ).then(() => {
                                console.log(userRoles);
                                console.log(channelRoleList);
                                let processListRole = [];
                                Promise.all(
                                    userRoles.map(async (role, index) => {
                                        if (channelRoleList.indexOf(role) !== -1) {
                                            // found in channelRoleList
                                            processListRole.push(role);
                                        }
                                        return index;
                                    }),
                                ).then(async () => {
                                    if (processListRole.length > 0) {
                                        let highOrderRole;
                                        if (processListRole.length > 1) {
                                            let flag = 100000;
                                            for (let i = 0; i < processListRole.length - 1; i++) {
                                                //find the highest priority role
                                                const data = await serverDocRef.collection('roles').doc(processListRole[i]).get();
                                                if ((await data.data().order) <= flag) {
                                                    highOrderRole = processListRole[i];
                                                    flag = await data.data().order;
                                                }
                                            }
                                        } else {
                                            highOrderRole = processListRole[0];
                                        }
                                        const enableResult = await channelDocRef
                                            .collection('roles')
                                            .doc(highOrderRole)
                                            .collection('channel_role_permissions')
                                            .doc(`1${permId}`)
                                            .get();
                                        const result = await enableResult.data().enable;
                                        switch (result) {
                                            case 'unset':
                                                //Check role_permissions
                                                serverDocRef
                                                    .collection('roles')
                                                    .doc(highOrderRole)
                                                    .collection('role_permissions')
                                                    .doc(`0${permId}`)
                                                    .get()
                                                    .then(async (perm) => {
                                                        if (stackTypeFlags) {
                                                            if (await perm.data().enable) {
                                                                next();
                                                            } else {
                                                                res.status(401).send(
                                                                    'You are not allowed to process this function',
                                                                );
                                                            }
                                                        } else {
                                                            res.status(200).send({ enable: await perm.data().enable });
                                                        }
                                                    })
                                                    .catch((err) => {
                                                        res.status(500).send('Internal Server Error!' + err.message);
                                                    });
                                                break;
                                            case true:
                                                if (stackTypeFlags) {
                                                    next();
                                                } else {
                                                    res.status(200).send({ enable: result });
                                                }
                                                break;
                                            case false:
                                                if (stackTypeFlags) {
                                                    res.status(401).send('You are not allowed to process this function');
                                                } else {
                                                    res.status(200).send({ enable: result });
                                                }
                                                break;
                                        }
                                    } else {
                                        res.status(500).send('How ?????2');
                                    }
                                });
                            });
                        })
                        .catch((error) => {
                            res.status(500).send('Internal Server Error!' + error.message);
                        });
                }
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error!');
            });
    }

    async CheckServerPermission(req, res, next) {
        const decodedIdToken = await req.body.decodedIdToken;
        const serverId = await req.body.serverId;
        const permId = await req.body.permId; // only used the last two characters to define permissions type

        const stackTypeFlags = (await req.body.stackTypeFlags) ? true : false; // true if this is the middleware stack and false if it is the endpoint api

        const serverDocRef = admin.db.collection('servers').doc(serverId);

        serverDocRef
            .collection('members')
            .doc(decodedIdToken.user_id)
            .get()
            .then(async (memberData) => {
                let tempListRoles = [];

                tempListRoles = [...(await memberData.data().roles)];
                tempListRoles.push('0');

                let processListRoles = [];

                Promise.all(
                    tempListRoles.map(async (role, index) => {
                        const roleData = await serverDocRef.collection('roles').doc(role).get();
                        processListRoles.push({
                            id: role,
                            order: await roleData.data().order,
                        });
                        return index;
                    }),
                )
                    .then(() => {
                        processListRoles.sort(function (a, b) {
                            return a.order - b.order;
                        });

                        let highOrderRole = processListRoles[0];
                        if (highOrderRole) {
                            serverDocRef
                                .collection('roles')
                                .doc(highOrderRole.id)
                                .collection('role_permissions')
                                .doc(`0${permId}`)
                                .get()
                                .then(async (perm) => {
                                    if (stackTypeFlags) {
                                        if (await perm.data().enable) {
                                            next();
                                        } else {
                                            res.status(401).send('You are not allowed to process this function');
                                        }
                                    } else {
                                        res.status(200).send({ enable: await perm.data().enable });
                                    }
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error!' + err.message);
                                });
                        } else {
                            res.status(500).send('Internal Server Error!');
                        }
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error!' + err.message);
                    });
            });
    }

    async CheckAdminPermission(req, res, next) {}
}

module.exports = new PermissionMiddleware();
