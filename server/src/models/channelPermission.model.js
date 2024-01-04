module.exports = class ChannelPermModel {
    constructor(payload) {
        const permissionsToAdd = [
            { permID: '1A0', data: { enable: payload['1A0'] } },
            { permID: '1A1', data: { enable: payload['1A1'] } },
            { permID: '1A2', data: { enable: payload['1A2'] } },
            { permID: '1C0', data: { enable: payload['1C0'] } },
            { permID: '1C1', data: { enable: payload['1C1'] } },
            { permID: '1C2', data: { enable: payload['1C2'] } },
            { permID: '1D0', data: { enable: payload['1D0'] } },
            { permID: '1D1', data: { enable: payload['1D1'] } },
            { permID: '1D2', data: { enable: payload['1D2'] } },
        ];
        return permissionsToAdd;
    }
};
