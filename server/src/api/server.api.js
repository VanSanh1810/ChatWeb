require('dotenv').config();
const admin = require('../configs/firebase/firebase.admin');
const { v4: uuidv4 } = require('uuid');
var crypto = require('crypto');
const ServerPermModel = require('../models/serverPermission.model');
const ChannelPermModel = require('../models/channelPermission.model');

class ServerApi {
    // [PUT] api/server/createServer
    async CreateServer(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const newServerId = req.body.newServerId;
        const newServerName = req.body.newServerName;
        const newServerImg = req.body.newServerImg;
        if (decodedIdToken.email_verified) {
            const userDocRef = admin.db.collection('users').doc(decodedIdToken.user_id);
            const serverDocRef = admin.db.collection('servers').doc(newServerId);
            await Promise.all([
                userDocRef.collection('servers').doc(newServerId).set({
                    serverImg: newServerImg,
                    joinAt: Date.now(),
                    owned: true,
                }),
                serverDocRef.set({
                    serverId: newServerId,
                    serverName: newServerName,
                    serverImg: newServerImg,
                    createAt: Date.now(),
                    lastModified: Date.now(),
                    owner: decodedIdToken.user_id,
                    banList: [],
                }),
                serverDocRef.collection('members').doc(decodedIdToken.user_id).set({ joinAt: Date.now(), roles: [] }),
                serverDocRef.collection('roles').doc('0').set({
                    roleName: '@everyone',
                    createAt: Date.now(),
                    addable: false,
                    order: 1000,
                    color: '#D1D1D1',
                }),
                serverDocRef.collection('chanels').doc('0').set({ chanelName: '', createAt: Date.now() }), //for room without channel
            ])
                .then(() => {
                    const permData = {
                        '0A0': true,
                        '0A1': false,
                        '0A2': false,
                        '0B0': true,
                        '0B1': false,
                        '0B2': false,
                        '0C0': true,
                        '0C1': true,
                        '0C2': true,
                        '0D0': true,
                        '0D1': true,
                        '0D2': true,
                        '0E0': false,
                    };
                    const permissionsToAdd = new ServerPermModel(permData);
                    const batch = admin.db.batch();
                    Promise.all(
                        permissionsToAdd.map(async (perm, index) => {
                            const newDocRef = serverDocRef
                                .collection('roles')
                                .doc('0')
                                .collection('role_permissions')
                                .doc(perm.permID);
                            batch.set(newDocRef, perm.data);
                            return index;
                        }),
                    )
                        .then(() => {
                            batch
                                .commit()
                                .then(() => {
                                    res.send(JSON.stringify({ status: 'OK' }));
                                })
                                .catch((error) => {
                                    res.status(500).send('Internal Server Error');
                                });
                        })
                        .catch((error) => {
                            res.status(500).send('Internal Server Error');
                        });
                })
                .catch((err) => {
                    res.status(500).send('Internal Server Error');
                });
        } else {
            res.status(401).send('UNAUTHORIZED REQUEST!' + 'Your email is not verified');
        }
    }

    async UpdateServerInfo(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const newServerName = req.body.newServerName;
        const newServerImg = req.body.newServerImg;
        const updateObj = newServerImg
            ? {
                  serverName: newServerName,
                  serverImg: newServerImg,
              }
            : {
                  serverName: newServerName,
              };
        admin.db
            .collection('servers')
            .doc(serverId)
            .update(updateObj)
            .then(() => {
                res.send(JSON.stringify({ status: 'OK' }));
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async CreateRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleName = req.body.roleName;
        const roleUser = req.body.roleUser;
        ////////////////////////////////
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef
            .collection('roles')
            .add({
                roleName: roleName,
                addable: true,
                createAt: Date.now(),
                members: roleUser ? [...roleUser] : [],
                color: '#D1D1D1',
            })
            .then((result) => {
                if (roleUser) {
                    Promise.all(
                        roleUser.map((user) => {
                            serverDocRef
                                .collection('members')
                                .doc(user)
                                .update({
                                    roles: admin.admin.firestore.FieldValue.arrayUnion(result.id),
                                });
                        }),
                    );
                }
                serverDocRef
                    .collection('roles')
                    .get()
                    .then((querySnapshot) => {
                        // Sử dụng thuộc tính size để đếm số lượng tài liệu
                        const numberOfDocuments = querySnapshot.size;
                        const permData = {
                            '0A0': false,
                            '0A1': false,
                            '0A2': false,
                            '0B0': false,
                            '0B1': false,
                            '0B2': false,
                            '0C0': false,
                            '0C1': false,
                            '0C2': false,
                            '0D0': false,
                            '0D1': false,
                            '0D2': false,
                            '0E0': false,
                        };
                        const permissionsToAdd = new ServerPermModel(permData);
                        const batch = admin.db.batch();
                        Promise.all(
                            permissionsToAdd.map(async (perm, index) => {
                                const newDocRef = serverDocRef
                                    .collection('roles')
                                    .doc(result.id)
                                    .collection('role_permissions')
                                    .doc(perm.permID);
                                batch.set(newDocRef, perm.data);
                                return index;
                            }),
                            serverDocRef
                                .collection('roles')
                                .doc(result.id)
                                .update({ order: numberOfDocuments - 2 }),
                        )
                            .then(() => {
                                batch
                                    .commit()
                                    .then(() => {
                                        res.send(JSON.stringify({ status: 'OK' }));
                                    })
                                    .catch((error) => {
                                        res.status(500).send('Internal Server Error');
                                    });
                            })
                            .catch((error) => {
                                res.status(500).send('Internal Server Error');
                            });
                    })
                    .catch((error) => {
                        console.error('Lỗi khi đếm số lượng tài liệu:', error);
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async UpdateRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleId = req.body.roleId;
        const roleNewName = req.body.roleNewName;
        const roleColor = req.body.roleColor;
        ////////////////////////////////
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef
            .collection('roles')
            .doc(roleId)
            .update({
                color: roleColor,
                roleName: roleNewName,
            })
            .then(async () => {
                res.send(JSON.stringify({ status: 'OK' }));
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async UpdateRolePermission(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleId = req.body.roleId;
        const permissions = req.body.permissions;
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        ////////////////////////////////
        const permissionsToAdd = new ServerPermModel(permissions);
        const batch = admin.db.batch();
        Promise.all(
            permissionsToAdd.map(async (perm, index) => {
                const newDocRef = serverDocRef.collection('roles').doc(roleId).collection('role_permissions').doc(perm.permID);
                batch.update(newDocRef, perm.data);
                return index;
            }),
        )
            .then(() => {
                batch
                    .commit()
                    .then(() => {
                        res.send(JSON.stringify({ status: 'OK' }));
                    })
                    .catch((error) => {
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch((error) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async UpdateRoleOrder(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const newRoleList = req.body.newRoleList;
        ////////////////////////////////
        Promise.all(
            newRoleList.map(async (role, index) => {
                return { id: role.id, order: role.id === '0' ? 1000 : index };
            }),
        )
            .then((roleList) => {
                const batch = admin.db.batch();
                const roleColRef = admin.db.collection('servers').doc(serverId).collection('roles');
                Promise.all(
                    roleList.map(async (role, index) => {
                        const tempDocRef = roleColRef.doc(role.id);
                        batch.update(tempDocRef, { order: role.order });
                    }),
                )
                    .then(() => {
                        batch
                            .commit()
                            .then(() => {
                                res.send(JSON.stringify({ status: 'OK' }));
                            })
                            .catch((error) => {
                                res.status(500).send('Internal Server Error');
                            });
                    })
                    .catch((error) => {
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async DeleteUserRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleName = req.body.roleName;
        const targetUser = req.body.targetUser;
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef.get().then((response) => {
            if (response.data().owner === decodedIdToken.user_id) {
                Promise.all([
                    serverDocRef
                        .collection('roles')
                        .doc(roleName)
                        .update({
                            members: admin.admin.firestore.FieldValue.arrayRemove(targetUser),
                        }),
                    serverDocRef
                        .collection('members')
                        .doc(targetUser)
                        .update({
                            roles: admin.admin.firestore.FieldValue.arrayRemove(roleName),
                        }),
                ])
                    .then(() => {
                        res.send(JSON.stringify({ status: 'OK' }));
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error');
                    });
            } else {
                res.status(403).send('UNAUTHORIZED REQUEST!');
            }
        });
    }

    async AddUserToRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleId = req.body.roleId;
        const roleUser = req.body.roleUser;
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef.get().then((response) => {
            if (response.data().owner === decodedIdToken.user_id) {
                serverDocRef
                    .collection('roles')
                    .doc(roleId)
                    .update({
                        members: admin.admin.firestore.FieldValue.arrayUnion(...roleUser),
                    })
                    .then(async () => {
                        if (roleUser) {
                            await Promise.all(
                                roleUser.map((user) => {
                                    serverDocRef
                                        .collection('members')
                                        .doc(user)
                                        .update({
                                            roles: admin.admin.firestore.FieldValue.arrayUnion(roleId),
                                        });
                                }),
                            );
                        }
                        res.send(JSON.stringify({ status: 'OK' }));
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error');
                    });
            } else {
                res.status(403).send('UNAUTHORIZED REQUEST!');
            }
        });
    }

    async RemooveUserFromRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleId = req.body.roleId;
        const roleUser = req.body.roleUser;
        ////////////////////////////////////////////////////////////////
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef
            .collection('roles')
            .doc(roleId)
            .update({
                members: admin.admin.firestore.FieldValue.arrayRemove(...roleUser),
            })
            .then(async () => {
                if (roleUser) {
                    await Promise.all(
                        roleUser.map((user) => {
                            serverDocRef
                                .collection('members')
                                .doc(user)
                                .update({
                                    roles: admin.admin.firestore.FieldValue.arrayRemove(roleId),
                                });
                        }),
                    );
                }
                res.send(JSON.stringify({ status: 'OK' }));
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async DeleteRole(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roleId = req.body.roleId;
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef
            .collection('roles')
            .doc(roleId)
            .get()
            .then(async (doc) => {
                const userInRole = await doc.data().members;
                serverDocRef
                    .collection('roles')
                    .doc(roleId)
                    .collection('role_permissions')
                    .get()
                    .then((perms) => {
                        const channelColRef = serverDocRef.collection('chanels');
                        channelColRef
                            .get()
                            .then((channels) => {
                                Promise.all([
                                    Promise.all(
                                        channels.docs.map(async (channel, index2) => {
                                            await channelColRef.doc(channel.id).collection('roles').doc(roleId).delete();
                                            const channelPerms = await channelColRef
                                                .doc(channel.id)
                                                .collection('roles')
                                                .doc(roleId)
                                                .collection('channel_role_permissions')
                                                .get();
                                            await Promise.all(
                                                channelPerms.docs.map(async (channelPerm, index3) => {
                                                    await channelColRef
                                                        .doc(channel.id)
                                                        .collection('roles')
                                                        .doc(roleId)
                                                        .collection('channel_role_permissions')
                                                        .doc(channelPerm.id)
                                                        .delete();
                                                    return index3;
                                                }),
                                            );
                                            return index2;
                                        }),
                                    ),
                                    Promise.all(
                                        perms.docs.map(async (perm, index) => {
                                            serverDocRef
                                                .collection('roles')
                                                .doc(roleId)
                                                .collection('role_permissions')
                                                .doc(perm.id)
                                                .delete();
                                            return index;
                                        }),
                                    ),
                                ])
                                    .then(() => {
                                        serverDocRef.collection('roles').doc(roleId).delete();
                                        if (userInRole.length > 0) {
                                            const memberColRef = serverDocRef.collection('members');
                                            userInRole.forEach((member) => {
                                                memberColRef.doc(member).update({
                                                    roles: admin.admin.firestore.FieldValue.arrayRemove(roleId),
                                                });
                                            });
                                        }
                                        res.send(JSON.stringify({ status: 'OK' }));
                                    })
                                    .catch(function (err) {
                                        res.status(500).send('Internal Server Error');
                                    });
                            })
                            .catch(function (err) {
                                res.status(500).send('Internal Server Error');
                            });
                    })
                    .catch(function (err) {
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async RemoveUserFromServer(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const userTarget = req.body.userTarget;
        const serverDocRef = admin.db.collection('servers').doc(serverId);

        serverDocRef.get().then((response) => {
            if (response.data().owner === decodedIdToken.user_id) {
                serverDocRef
                    .collection('members')
                    .doc(userTarget)
                    .get()
                    .then(async (user) => {
                        let userRole = [];
                        userRole = await user.data().roles;
                        Promise.all([
                            Promise.all([
                                userRole.map((role) => {
                                    serverDocRef
                                        .collection('roles')
                                        .doc(role)
                                        .update({ members: admin.admin.firestore.FieldValue.arrayRemove(userTarget) });
                                }),
                            ]),
                            serverDocRef.collection('members').doc(userTarget).delete(),
                        ])
                            .then(() => {
                                res.send(JSON.stringify({ status: 'OK' }));
                            })
                            .catch((err) => {
                                res.status(500).send('Internal Server Error');
                            });
                    });
            } else {
                res.status(403).send('UNAUTHORIZED REQUEST!');
            }
        });
    }

    async GetServerInviteKey(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverDocRef = admin.db.collection('servers').doc(serverId);
        serverDocRef.get().then((response) => {
            if (response.data().inviteKey) {
                res.send(JSON.stringify({ status: 'OK', inviteKey: response.data().inviteKey }));
            } else {
                var id = crypto.randomBytes(10).toString('hex');
                serverDocRef.set({ inviteKey: id }, { merge: true }).then((response) => {
                    res.send(JSON.stringify({ status: 'OK', inviteKey: id }));
                });
            }
        });
    }

    async JoinServer(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const inviteKey = req.body.inviteKey;
        const serverColRef = admin.db.collection('servers');
        const userDocRef = admin.db.collection('users').doc(decodedIdToken.user_id);
        serverColRef
            .where('inviteKey', '==', inviteKey)
            .get()
            .then(async (querySnapshot) => {
                const serverId = querySnapshot.docs[0].id;
                const serverImg = await querySnapshot.docs[0].data().serverImg;
                userDocRef
                    .collection('servers')
                    .doc(serverId)
                    .get()
                    .then((response) => {
                        if (!response.exists) {
                            Promise.all([
                                serverColRef
                                    .doc(serverId)
                                    .collection('members')
                                    .doc(decodedIdToken.user_id)
                                    .set({ joinAt: Date.now(), roles: [] }),
                                userDocRef
                                    .collection('servers')
                                    .doc(serverId)
                                    .set({ joinAt: Date.now(), owned: false, serverImg: serverImg }),
                            ])
                                .then(() => {
                                    res.send(JSON.stringify('Join server successfuly !'));
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error');
                                });
                        } else {
                            res.send(JSON.stringify('You already join this server !'));
                        }
                    });
            });
    }

    async CreateChannel(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverRef = admin.db.collection('servers').doc(serverId);
        const channelId = uuidv4();
        const newChannelName = req.body.newChannelName;
        const isPrivate = req.body.isPrivate;
        ////////////////////////////////
        serverRef
            .collection('chanels')
            .doc(channelId)
            .set({ chanelName: newChannelName, createAt: Date.now(), private: isPrivate })
            .then(() => {
                // for private channel
                const roleAndData = Array.isArray(req.body.roleAndData) ? req.body.roleAndData : []; // array of user and role have permissions to access the channel
                let roleList = [];
                let memberList = [];
                const evr_permData = {
                    '1A0': isPrivate ? false : 'unset',
                    '1A1': 'unset',
                    '1A2': 'unset',
                    '1C0': 'unset',
                    '1C1': 'unset',
                    '1C2': 'unset',
                    '1D0': 'unset',
                    '1D1': 'unset',
                    '1D2': 'unset',
                };
                const evr_permissionsToAdd = new ChannelPermModel(evr_permData);
                Promise.all(
                    roleAndData.map((data, index) => {
                        if (data.type === 'member') {
                            memberList.push(data.id);
                        } else {
                            roleList.push(data.id);
                        }
                        return index;
                    }),
                ).then(() => {
                    Promise.all(
                        roleList.map(async (role, index) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('roles')
                                .doc(role)
                                .set({ addAt: Date.now() });
                            const permData = {
                                '1A0': 'unset',
                                '1A1': 'unset',
                                '1A2': 'unset',
                                '1C0': 'unset',
                                '1C1': 'unset',
                                '1C2': 'unset',
                                '1D0': 'unset',
                                '1D1': 'unset',
                                '1D2': 'unset',
                            };
                            const permissionsToAdd = new ChannelPermModel(permData);
                            Promise.all(
                                permissionsToAdd.map(async (perm, index2) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('roles')
                                        .doc(role)
                                        .collection('channel_role_permissions')
                                        .doc(perm.permID)
                                        .set(perm.data);
                                    return index2;
                                }),
                            ).then(() => {
                                return index;
                            });
                        }),
                        memberList.map(async (member, index) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('members')
                                .doc(member)
                                .set({ addAt: Date.now() });
                            const permData = {
                                '1A0': 'unset',
                                '1A1': 'unset',
                                '1A2': 'unset',
                                '1C0': 'unset',
                                '1C1': 'unset',
                                '1C2': 'unset',
                                '1D0': 'unset',
                                '1D1': 'unset',
                                '1D2': 'unset',
                            };
                            const permissionsToAdd = new ChannelPermModel(permData);
                            Promise.all(
                                permissionsToAdd.map(async (perm, index2) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('members')
                                        .doc(member)
                                        .collection('channel_member_permissions')
                                        .doc(perm.permID)
                                        .set(perm.data);
                                    return index2;
                                }),
                            ).then(() => {
                                return index;
                            });
                        }),
                        serverRef.collection('chanels').doc(channelId).collection('roles').doc('0').set({ addAt: Date.now() }),
                        evr_permissionsToAdd.map(async (perm, index2) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('roles')
                                .doc('0')
                                .collection('channel_role_permissions')
                                .doc(perm.permID)
                                .set(perm.data);
                            return index2;
                        }),
                    )
                        .then(() => {
                            res.send(JSON.stringify({ status: 'OK' }));
                        })
                        .catch((err) => {
                            res.status(500).send('Internal Server Error');
                        });
                });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async UpdateChannel(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverRef = admin.db.collection('servers').doc(serverId);
        if (req.body.newName) {
            const channelId = req.body.channelId;
            const channelName = req.body.newName;
            serverRef
                .collection('chanels')
                .doc(channelId)
                .update({ chanelName: channelName })
                .then((response) => {
                    res.send(JSON.stringify({ status: 'OK' }));
                });
        } else {
            const channelId = req.body.channelId;
            const isPrivate = req.body.isPrivate;
            serverRef
                .collection('chanels')
                .doc(channelId)
                .update({ private: isPrivate })
                .then((response) => {
                    serverRef
                        .collection('chanels')
                        .doc(channelId)
                        .collection('roles')
                        .doc('0')
                        .collection('channel_role_permissions')
                        .doc('1A0')
                        .update({ enable: isPrivate ? false : 'unset' })
                        .then(() => {
                            const channelRef = serverRef.collection('chanels').doc(channelId);
                            if (!isPrivate) {
                                Promise.all([channelRef.collection('roles').get(), channelRef.collection('members').get()])
                                    .then((results) => {
                                        Promise.all([
                                            Promise.all(
                                                results[0].docs.map(async (role, index) => {
                                                    if (role.id !== '0') {
                                                        channelRef.collection('roles').doc(role.id).delete();
                                                        const perms = await channelRef
                                                            .collection('roles')
                                                            .doc(role.id)
                                                            .collection('channel_role_permissions')
                                                            .get();
                                                        await Promise.all(
                                                            perms.docs.map(async (perm, index2) => {
                                                                await channelRef
                                                                    .collection('roles')
                                                                    .doc(role.id)
                                                                    .collection('channel_role_permissions')
                                                                    .doc(perm.id)
                                                                    .delete();
                                                                return index2;
                                                            }),
                                                        );
                                                    }
                                                    return index;
                                                }),
                                            ),
                                            Promise.all(
                                                results[1].docs.map(async (member, index) => {
                                                    channelRef.collection('members').doc(member.id).delete();
                                                    const perms = await channelRef
                                                        .collection('members')
                                                        .doc(member.id)
                                                        .collection('channel_member_permissions')
                                                        .get();
                                                    await Promise.all(
                                                        perms.docs.map(async (perm, index2) => {
                                                            await channelRef
                                                                .collection('members')
                                                                .doc(member.id)
                                                                .collection('channel_member_permissions')
                                                                .doc(perm.id)
                                                                .delete();
                                                            return index2;
                                                        }),
                                                    );
                                                }),
                                            ),
                                        ])
                                            .then(() => {
                                                res.send(JSON.stringify({ status: 'OK' }));
                                            })
                                            .catch((err) => {
                                                res.status(500).send('Internal Server Error');
                                            });
                                    })
                                    .catch((err) => {
                                        res.status(500).send('Internal Server Error');
                                    });
                            } else {
                                res.status(500).send('Internal Server Error');
                            }
                        })
                        .catch((err) => {
                            res.status(500).send('Internal Server Error');
                        });
                })
                .catch((err) => {
                    res.status(500).send('Internal Server Error');
                });
        }
    }

    async RemoveAccessFromChannel(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverRef = admin.db.collection('servers').doc(serverId);
        const channelId = req.body.channelId;
        const type = req.body.type;
        const dataToRemove = req.body.data;
        ////////////////////////////////////////////////////////////////
        if (type === 'role') {
            serverRef
                .collection('chanels')
                .doc(channelId)
                .collection('roles')
                .doc(dataToRemove)
                .delete()
                .then(() => {
                    serverRef
                        .collection('chanels')
                        .doc(channelId)
                        .collection('roles')
                        .doc(dataToRemove)
                        .collection('channel_role_permissions')
                        .get()
                        .then((perms) => {
                            Promise.all(
                                perms.docs.map(async (perm, index) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('roles')
                                        .doc(dataToRemove)
                                        .collection('channel_role_permissions')
                                        .doc(perm.id)
                                        .delete()
                                        .then(() => {
                                            return index;
                                        });
                                }),
                            )
                                .then(() => {
                                    res.send(JSON.stringify({ status: 'OK' }));
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error');
                                });
                        })
                        .catch((err) => {
                            res.status(500).send('Internal Server Error');
                        });
                })
                .catch((err) => {
                    res.status(500).send('Internal Server Error');
                });
        } else {
            serverRef
                .collection('chanels')
                .doc(channelId)
                .collection('members')
                .doc(dataToRemove)
                .delete()
                .then(() => {
                    serverRef
                        .collection('chanels')
                        .doc(channelId)
                        .collection('members')
                        .doc(dataToRemove)
                        .collection('channel_member_permissions')
                        .get()
                        .then((perms) => {
                            Promise.all(
                                perms.docs.map(async (perm, index) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('members')
                                        .doc(dataToRemove)
                                        .collection('channel_member_permissions')
                                        .doc(perm.id)
                                        .delete()
                                        .then(() => {
                                            return index;
                                        });
                                }),
                            )
                                .then(() => {
                                    res.send(JSON.stringify({ status: 'OK' }));
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error');
                                });
                        })
                        .catch((err) => {
                            res.status(500).send('Internal Server Error');
                        });
                })
                .catch((err) => {
                    res.status(500).send('Internal Server Error');
                });
        }
    }

    async AddAccessToChannel(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverRef = admin.db.collection('servers').doc(serverId);
        const channelId = req.body.channelId;
        serverRef
            .collection('chanels')
            .doc(channelId)
            .update({ private: true })
            .then(() => {
                // for private channel
                const roleAndData = Array.isArray(req.body.roleAndData) ? req.body.roleAndData : []; // array of user and role have permissions to access the channel
                let roleList = [];
                let memberList = [];
                const evr_permData = {
                    '1A0': false,
                    '1A1': 'unset',
                    '1A2': 'unset',
                    '1C0': 'unset',
                    '1C1': 'unset',
                    '1C2': 'unset',
                    '1D0': 'unset',
                    '1D1': 'unset',
                    '1D2': 'unset',
                };
                const evr_permissionsToAdd = new ChannelPermModel(evr_permData);
                Promise.all(
                    roleAndData.map((data, index) => {
                        if (data.type === 'member') {
                            memberList.push(data.id);
                        } else {
                            roleList.push(data.id);
                        }
                        return index;
                    }),
                ).then(() => {
                    Promise.all(
                        roleList.map(async (role, index) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('roles')
                                .doc(role)
                                .set({ addAt: Date.now() });
                            const permData = {
                                '1A0': 'unset',
                                '1A1': 'unset',
                                '1A2': 'unset',
                                '1C0': 'unset',
                                '1C1': 'unset',
                                '1C2': 'unset',
                                '1D0': 'unset',
                                '1D1': 'unset',
                                '1D2': 'unset',
                            };
                            const permissionsToAdd = new ChannelPermModel(permData);
                            Promise.all(
                                permissionsToAdd.map(async (perm, index2) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('roles')
                                        .doc(role)
                                        .collection('channel_role_permissions')
                                        .doc(perm.permID)
                                        .set(perm.data);
                                    return index2;
                                }),
                            ).then(() => {
                                return index;
                            });
                        }),
                        memberList.map(async (member, index) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('members')
                                .doc(member)
                                .set({ addAt: Date.now() });
                            const permData = {
                                '1A0': 'unset',
                                '1A1': 'unset',
                                '1A2': 'unset',
                                '1C0': 'unset',
                                '1C1': 'unset',
                                '1C2': 'unset',
                                '1D0': 'unset',
                                '1D1': 'unset',
                                '1D2': 'unset',
                            };
                            const permissionsToAdd = new ChannelPermModel(permData);
                            Promise.all(
                                permissionsToAdd.map(async (perm, index2) => {
                                    serverRef
                                        .collection('chanels')
                                        .doc(channelId)
                                        .collection('members')
                                        .doc(member)
                                        .collection('channel_member_permissions')
                                        .doc(perm.permID)
                                        .set(perm.data);
                                    return index2;
                                }),
                            ).then(() => {
                                return index;
                            });
                        }),
                        serverRef.collection('chanels').doc(channelId).collection('roles').doc('0').set({ addAt: Date.now() }),
                        evr_permissionsToAdd.map(async (perm, index2) => {
                            serverRef
                                .collection('chanels')
                                .doc(channelId)
                                .collection('roles')
                                .doc('0')
                                .collection('channel_role_permissions')
                                .doc(perm.permID)
                                .set(perm.data);
                            return index2;
                        }),
                    )
                        .then(() => {
                            res.send(JSON.stringify({ status: 'OK' }));
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).send('Internal Server Error');
                        });
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Internal Server Error');
            });
    }

    async CreateRoom(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverRef = admin.db.collection('servers').doc(serverId);
        serverRef.get().then((response) => {
            if (response.data().owner === decodedIdToken.user_id) {
                const channelId = req.body.channelId;
                const newRoomName = req.body.roomName;
                const roomtype = req.body.roomType;
                if (channelId) {
                    serverRef
                        .collection('chanels')
                        .doc(channelId)
                        .collection('rooms')
                        .add({
                            roomName: newRoomName,
                            createAt: Date.now(),
                            lastModified: Date.now(),
                            roomType: roomtype === 0 ? 'text' : 'voice',
                        })
                        .then((result) => {
                            const storageRef = admin.storage.bucket().file(`serverStorage/${serverId}/${result.id}/`);
                            storageRef.createWriteStream().end();
                        });
                } else {
                    serverRef
                        .collection('chanels')
                        .doc('0')
                        .collection('rooms')
                        .add({
                            roomName: newRoomName,
                            createAt: Date.now(),
                            lastModified: Date.now(),
                            roomType: roomtype === 0 ? 'text' : 'voice',
                        })
                        .then((result) => {
                            const storageRef = admin.storage.bucket().file(`serverStorage/${serverId}/${result.id}/`);
                            storageRef.createWriteStream().end();
                        });
                }
            } else {
                res.status(403).send('UNAUTHORIZED REQUEST!');
            }
        });
    } //OK

    async LeaveServer(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const serverColRef = admin.db.collection('servers');
        const userDocRef = admin.db.collection('users').doc(decodedIdToken.user_id);
        Promise.all([
            serverColRef.doc(serverId).collection('members').doc(decodedIdToken.user_id).delete(),
            userDocRef.collection('servers').doc(serverId).delete(),
        ])
            .then(() => {
                serverColRef
                    .doc(serverId)
                    .collection('roles')
                    .get()
                    .then((docs) => {
                        Promise.all(
                            docs.docs.map((doc) => {
                                serverColRef
                                    .doc(serverId)
                                    .collection('roles')
                                    .doc(doc.id)
                                    .update({ members: admin.admin.firestore.FieldValue.arrayRemove(decodedIdToken.user_id) });
                            }),
                        )
                            .then(() => {
                                serverColRef
                                    .doc(serverId)
                                    .collection('chanels')
                                    .get()
                                    .then((channels) => {
                                        Promise.all(
                                            channels.docs.map(async (channel, index) => {
                                                const perms = await serverColRef
                                                    .doc(serverId)
                                                    .collection('chanels')
                                                    .doc(channel.id)
                                                    .collection('members')
                                                    .doc(decodedIdToken.user_id)
                                                    .collection('channel_member_permissions')
                                                    .get();
                                                await Promise.all([
                                                    serverColRef
                                                        .doc(serverId)
                                                        .collection('chanels')
                                                        .doc(channel.id)
                                                        .collection('members')
                                                        .doc(decodedIdToken.user_id)
                                                        .delete(),
                                                    Promise.all(
                                                        perms.docs.map(async (perm, index2) => {
                                                            await serverColRef
                                                                .doc(serverId)
                                                                .collection('chanels')
                                                                .doc(channel.id)
                                                                .collection('members')
                                                                .doc(decodedIdToken.user_id)
                                                                .collection('channel_member_permissions')
                                                                .doc(perm.id)
                                                                .delete();
                                                            return index2;
                                                        }),
                                                    ),
                                                ]);
                                                return index;
                                            }),
                                        )
                                            .then(() => {
                                                res.send(JSON.stringify({ status: 'OK' }));
                                            })
                                            .catch((err) => {
                                                res.status(500).send('Internal Server Error');
                                            });
                                    });
                            })
                            .catch((err) => {
                                res.status(500).send('Internal Server Error');
                            });
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async KickUser(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const userToKick = req.body.userToKick;
        const serverId = req.body.serverId;
        const serverColRef = admin.db.collection('servers');
        const userDocRef = admin.db.collection('users').doc(userToKick);
        Promise.all([
            serverColRef.doc(serverId).collection('members').doc(userToKick).delete(),
            userDocRef.collection('servers').doc(serverId).delete(),
        ])
            .then(() => {
                serverColRef
                    .doc(serverId)
                    .collection('roles')
                    .get()
                    .then((docs) => {
                        Promise.all(
                            docs.docs.map((doc) => {
                                serverColRef
                                    .doc(serverId)
                                    .collection('roles')
                                    .doc(doc.id)
                                    .update({ members: admin.admin.firestore.FieldValue.arrayRemove(userToKick) });
                            }),
                        )
                            .then(() => {
                                serverColRef
                                    .doc(serverId)
                                    .collection('chanels')
                                    .get()
                                    .then((channels) => {
                                        Promise.all(
                                            channels.docs.map(async (channel, index) => {
                                                const perms = await serverColRef
                                                    .doc(serverId)
                                                    .collection('chanels')
                                                    .doc(channel.id)
                                                    .collection('members')
                                                    .doc(userToKick)
                                                    .collection('channel_member_permissions')
                                                    .get();
                                                await Promise.all([
                                                    serverColRef
                                                        .doc(serverId)
                                                        .collection('chanels')
                                                        .doc(channel.id)
                                                        .collection('members')
                                                        .doc(userToKick)
                                                        .delete(),
                                                    Promise.all(
                                                        perms.docs.map(async (perm, index2) => {
                                                            await serverColRef
                                                                .doc(serverId)
                                                                .collection('chanels')
                                                                .doc(channel.id)
                                                                .collection('members')
                                                                .doc(userToKick)
                                                                .collection('channel_member_permissions')
                                                                .doc(perm.id)
                                                                .delete();
                                                            return index2;
                                                        }),
                                                    ),
                                                ]);
                                                return index;
                                            }),
                                        )
                                            .then(async () => {
                                                const isBan = req.body.isBan;
                                                if (isBan) {
                                                    Promise.all([
                                                        await admin.db.collection('servers').doc(serverId).get(),
                                                        await admin.db.collection('users').doc(decodedIdToken.user_id).get(),
                                                    ]).then((results) => {
                                                        const serverImg = results[0].data().serverImg;
                                                        const serverName = results[0].data().serverName;
                                                        const senderName = results[1].data().name;
                                                        ////////////////////////////////
                                                        admin.db
                                                            .collection('users')
                                                            .doc(userToKick)
                                                            .collection('notifyList')
                                                            .add({
                                                                sender: decodedIdToken.user_id,
                                                                actionButton: [],
                                                                title: 'Server Ban',
                                                                describe: `You have been banned from ${serverName}`,
                                                                img: serverImg,
                                                                isSeen: false,
                                                                createAt: Date.now(),
                                                            })
                                                            .then(() => {
                                                                admin.db
                                                                    .collection('servers')
                                                                    .doc(serverId)
                                                                    .update({
                                                                        banList:
                                                                            admin.admin.firestore.FieldValue.arrayUnion(
                                                                                userToKick,
                                                                            ),
                                                                    });
                                                                res.send(JSON.stringify({ status: 'OK' }));
                                                            })
                                                            .catch((err) => {
                                                                res.status(500).send('Internal Server Error' + err.message);
                                                            });
                                                    });
                                                } else {
                                                    res.send(JSON.stringify({ status: 'OK' }));
                                                }
                                            })
                                            .catch((err) => {
                                                res.status(500).send('Internal Server Error');
                                            });
                                    });
                            })
                            .catch((err) => {
                                res.status(500).send('Internal Server Error');
                            });
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error');
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error');
            });
    }

    async DeleteChannel(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const channelId = req.body.channelId;

        const channelColRef = admin.db.collection('servers').doc(serverId).collection('chanels');

        const nullChannelRefRooms = channelColRef.doc('0').collection('rooms');
        const channelToDelRef = channelColRef.doc(channelId);
        channelToDelRef
            .collection('rooms')
            .get()
            .then((docs) => {
                Promise.all(
                    docs.docs.map((doc, index) => {
                        nullChannelRefRooms
                            .doc(doc.id)
                            .set({
                                createAt: doc.data().createAt,
                                lastModified: doc.data().lastModified,
                                roomName: doc.data().roomName,
                                roomType: doc.data().roomType,
                            })
                            .then(() => {
                                channelToDelRef
                                    .collection('rooms')
                                    .doc(doc.id)
                                    .collection('messages')
                                    .get()
                                    .then(async (messages) => {
                                        if (!messages.empty) {
                                            await Promise.all(
                                                messages.docs.map(async (message, index2) => {
                                                    await nullChannelRefRooms
                                                        .doc(doc.id)
                                                        .collection('messages')
                                                        .doc(message.id)
                                                        .set({
                                                            isImg: message.data().isImg,
                                                            mediaData: message.data().mediaData,
                                                            message: message.data().message,
                                                            sendAt: message.data().sendAt,
                                                            sendBy: message.data().sendBy,
                                                        });
                                                    return index2;
                                                }),
                                            );
                                        }
                                        channelToDelRef.delete().then(() => {
                                            channelToDelRef
                                                .collection('rooms')
                                                .get()
                                                .then((_rooms) => {
                                                    Promise.all(
                                                        _rooms.docs.map(async (room, index) => {
                                                            await channelToDelRef.collection('rooms').doc(room.id).delete();
                                                            const messColRef = channelToDelRef
                                                                .collection('rooms')
                                                                .doc(room.id)
                                                                .collection('messages');
                                                            let messList = await messColRef.get();
                                                            if (!messList.empty) {
                                                                await Promise.all(
                                                                    messList.docs.map(async (messItem, i) => {
                                                                        await messColRef.doc(messItem.id).delete();
                                                                        return i;
                                                                    }),
                                                                );
                                                            }
                                                            return index;
                                                        }),
                                                    )
                                                        .then(() => {
                                                            Promise.all([
                                                                channelToDelRef.collection('roles').get(),
                                                                channelToDelRef.collection('members').get(),
                                                            ]).then((results) => {
                                                                Promise.all([
                                                                    Promise.all(
                                                                        results[0].docs.map(async (role, iRole) => {
                                                                            channelToDelRef
                                                                                .collection('roles')
                                                                                .doc(role.id)
                                                                                .delete();
                                                                            const perms = await channelToDelRef
                                                                                .collection('roles')
                                                                                .doc(role.id)
                                                                                .collection('channel_role_permissions')
                                                                                .get();
                                                                            await Promise.all(
                                                                                perms.docs.map(async (perm, iPerm) => {
                                                                                    await channelToDelRef
                                                                                        .collection('roles')
                                                                                        .doc(role.id)
                                                                                        .collection('channel_role_permissions')
                                                                                        .doc(perm.id)
                                                                                        .delete();
                                                                                    return iPerm;
                                                                                }),
                                                                            );
                                                                            return iRole;
                                                                        }),
                                                                    ),
                                                                    Promise.all(
                                                                        results[1].docs.map(async (mem, iMem) => {
                                                                            channelToDelRef
                                                                                .collection('members')
                                                                                .doc(mem.id)
                                                                                .delete();
                                                                            const perms = await channelToDelRef
                                                                                .collection('members')
                                                                                .doc(mem.id)
                                                                                .collection('channel_member_permissions')
                                                                                .get();
                                                                            await Promise.all(
                                                                                perms.docs.map(async (perm, iPerm) => {
                                                                                    await channelToDelRef
                                                                                        .collection('members')
                                                                                        .doc(mem.id)
                                                                                        .collection('channel_member_permissions')
                                                                                        .doc(perm.id)
                                                                                        .delete();
                                                                                    return iPerm;
                                                                                }),
                                                                            );
                                                                            return iMem;
                                                                        }),
                                                                    ),
                                                                ]);
                                                            });
                                                            // res.send(JSON.stringify({ status: 'OK' }));
                                                        })
                                                        .catch((err) => {
                                                            res.status(500).send('Internal Server Error' + err.message);
                                                        });
                                                });
                                        });
                                        return index;
                                    })
                                    .catch((err) => {
                                        res.status(500).send('Internal Server Error' + err.message);
                                    });
                            })
                            .catch((err) => {
                                res.status(500).send('Internal Server Error' + err.message);
                            });
                    }),
                )
                    .then(() => {
                        res.send(JSON.stringify({ status: 'OK' }));
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error' + err.message);
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error' + err.message);
            });
    }

    async RenameRoom(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const channelId = req.body.channelId;
        const roomId = req.body.roomId;
        const newRoomName = req.body.roomName;
        admin.db
            .collection('servers')
            .doc(serverId)
            .collection('chanels')
            .doc(channelId)
            .collection('rooms')
            .doc(roomId)
            .update({ roomName: newRoomName })
            .then(() => {
                res.send(JSON.stringify({ status: 'OK' }));
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error' + err.message);
            });
    } // OK

    async DeleteRoom(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const channelId = req.body.channelId;
        const roomId = req.body.roomId;
        ////////////////////////////////
        const roomRef = admin.db
            .collection('servers')
            .doc(serverId)
            .collection('chanels')
            .doc(channelId)
            .collection('rooms')
            .doc(roomId);
        roomRef
            .collection('messages')
            .get()
            .then((docs) => {
                Promise.all(
                    docs.docs.map(async (doc, index) => {
                        await roomRef.collection('messages').doc(doc.id).delete();
                        return index;
                    }),
                ).then(() => {
                    roomRef.delete().then(async () => {
                        const folderPath = `serverStorage/${serverId}/${roomId}`;
                        try {
                            // List tất cả các file trong thư mục
                            // const [files] = admin.storage.bucket().getFiles({
                            //     directory: folderPath,
                            // });
                            // // Xóa tất cả các file trong thư mục
                            // await Promise.all(files.map((file) => file.delete()));
                            // Xóa thư mục
                            await admin.storage.bucket().deleteFiles({
                                prefix: folderPath,
                            });

                            console.log(`Đã xóa thư mục ${folderPath}`);
                            res.send(JSON.stringify({ status: 'OK' }));
                        } catch (error) {
                            console.error('Lỗi khi xóa thư mục:', error);
                            res.status(500).send('Internal Server Error' + error);
                        }
                    });
                });
            });
    } //OK

    async MoveRoom(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const roomId = req.body.roomId;
        const currentChannel = req.body.currentChannel;
        const targetChannelId = req.body.targetChannelId;
        admin.db
            .collection('servers')
            .doc(serverId)
            .collection('chanels')
            .doc(currentChannel)
            .collection('rooms')
            .doc(roomId)
            .get()
            .then((room) => {
                admin.db
                    .collection('servers')
                    .doc(serverId)
                    .collection('chanels')
                    .doc(targetChannelId)
                    .collection('rooms')
                    .doc(roomId)
                    .set({
                        createAt: room.data().createAt,
                        lastModified: room.data().lastModified,
                        roomName: room.data().roomName,
                        roomType: room.data().roomType,
                    })
                    .then(() => {
                        if (room.data().roomType === 'text') {
                            const tempRef = admin.db
                                .collection('servers')
                                .doc(serverId)
                                .collection('chanels')
                                .doc(targetChannelId)
                                .collection('rooms')
                                .doc(roomId)
                                .collection('messages');
                            admin.db
                                .collection('servers')
                                .doc(serverId)
                                .collection('chanels')
                                .doc(currentChannel)
                                .collection('rooms')
                                .doc(roomId)
                                .collection('messages')
                                .get()
                                .then((messages) => {
                                    Promise.all(
                                        messages.docs.map(async (message, index) => {
                                            await tempRef.doc(message.id).set({
                                                isImg: message.data().isImg,
                                                mediaData: message.data().mediaData,
                                                message: message.data().message,
                                                sendAt: message.data().sendAt,
                                                sendBy: message.data().sendBy,
                                            });
                                        }),
                                    )
                                        .then(() => {
                                            admin.db
                                                .collection('servers')
                                                .doc(serverId)
                                                .collection('chanels')
                                                .doc(currentChannel)
                                                .collection('rooms')
                                                .doc(roomId)
                                                .delete()
                                                .then(() => {
                                                    res.send(JSON.stringify({ status: 'OK' }));
                                                })
                                                .catch((err) => {
                                                    res.status(500).send('Internal Server Error' + err.message);
                                                });
                                        })
                                        .catch((err) => {
                                            res.status(500).send('Internal Server Error' + err.message);
                                        });
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error' + err.message);
                                });
                        } else {
                            admin.db
                                .collection('servers')
                                .doc(serverId)
                                .collection('chanels')
                                .doc(currentChannel)
                                .collection('rooms')
                                .doc(roomId)
                                .delete()
                                .then(() => {
                                    res.send(JSON.stringify({ status: 'OK' }));
                                })
                                .catch((err) => {
                                    res.status(500).send('Internal Server Error' + err.message);
                                });
                        }
                    })
                    .catch((err) => {
                        res.status(500).send('Internal Server Error' + err.message);
                    });
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error' + err.message);
            });
    } //OK

    async InviteToServer(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const userToInvite = req.body.userToInvite;
        Promise.all([
            await admin.db.collection('servers').doc(serverId).get(),
            await admin.db.collection('users').doc(decodedIdToken.user_id).get(),
        ]).then((results) => {
            const serverImg = results[0].data().serverImg;
            const serverName = results[0].data().serverName;
            const senderName = results[1].data().name;
            ////////////////////////////////
            admin.db
                .collection('users')
                .doc(userToInvite)
                .collection('notifyList')
                .add({
                    sender: decodedIdToken.user_id,
                    actionButton: [
                        {
                            btnName: 'Accept',
                            endpoint: '/api/server/inviteJoinServer',
                            payload: { serverId: serverId, isReject: false },
                            color: '#5eff45',
                        },
                        {
                            btnName: 'Reject',
                            endpoint: '/api/server/inviteJoinServer',
                            payload: { serverId: serverId, isReject: true },
                            color: '#bdbdbd',
                        },
                    ],
                    title: 'Server Invitation',
                    describe: `${senderName} want to invite you to ${serverName}`,
                    img: serverImg,
                    isSeen: false,
                    createAt: Date.now(),
                })
                .then(() => {
                    res.send(JSON.stringify({ status: 'OK' }));
                })
                .catch((err) => {
                    res.status(500).send('Internal Server Error' + err.message);
                });
        });
    }

    async JoinServerByInvitation(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const payload = req.body.payload;
        const serverId = payload.serverId;
        const isReject = payload.isReject;
        if (isReject) {
            next();
        } else {
            const serverColRef = admin.db.collection('servers');
            const userDocRef = admin.db.collection('users').doc(decodedIdToken.user_id);
            serverColRef
                .doc(serverId)
                .get()
                .then(async (serverData) => {
                    const serverId = serverData.id;
                    const serverImg = await serverData.data().serverImg;
                    userDocRef
                        .collection('servers')
                        .doc(serverId)
                        .get()
                        .then((response) => {
                            if (!response.exists) {
                                Promise.all([
                                    serverColRef
                                        .doc(serverId)
                                        .collection('members')
                                        .doc(decodedIdToken.user_id)
                                        .set({ joinAt: Date.now(), roles: [] }),
                                    userDocRef
                                        .collection('servers')
                                        .doc(serverId)
                                        .set({ joinAt: Date.now(), owned: false, serverImg: serverImg }),
                                ])
                                    .then(() => {
                                        next();
                                    })
                                    .catch((err) => {
                                        res.status(500).send('Internal Server Error');
                                    });
                            } else {
                                res.send(JSON.stringify('You already join this server !'));
                            }
                        });
                });
        }
    }

    async RemoveBan(req, res, next) {
        const decodedIdToken = req.body.decodedIdToken;
        const serverId = req.body.serverId;
        const targetUser = req.body.targetUser;
        admin.db
            .collection('servers')
            .doc(serverId)
            .update({
                banList: admin.admin.firestore.FieldValue.arrayRemove(targetUser),
            })
            .then(() => {
                res.send(JSON.stringify({ status: 'OK' }));
            })
            .catch((err) => {
                res.status(500).send('Internal Server Error' + err.message);
            });
    }
}

module.exports = new ServerApi();
