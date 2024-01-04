module.exports = class ServerPermModel {
    constructor(payload) {
        const permissionsToAdd = [
            { permID: '0A0', data: { enable: payload['0A0'] } },
            { permID: '0A1', data: { enable: payload['0A1'] } },
            { permID: '0A2', data: { enable: payload['0A2'] } },
            { permID: '0B0', data: { enable: payload['0B0'] } },
            { permID: '0B1', data: { enable: payload['0B1'] } },
            { permID: '0B2', data: { enable: payload['0B2'] } },
            { permID: '0C0', data: { enable: payload['0C0'] } },
            { permID: '0C1', data: { enable: payload['0C1'] } },
            { permID: '0C2', data: { enable: payload['0C2'] } },
            { permID: '0D0', data: { enable: payload['0D0'] } },
            { permID: '0D1', data: { enable: payload['0D1'] } },
            { permID: '0D2', data: { enable: payload['0D2'] } },
            { permID: '0E0', data: { enable: payload['0E0'] } },
        ];
        return permissionsToAdd;
    }
};
