export default class ChatRoomModel {
    constructor(roomID, roomName, users, messages, createdAt, lastModifyAt, isDisable) {
        this.roomID = roomID;
        this.roomName = roomName || "";
        this.users = users || [];
        this.messages = messages;
        this.createdAt = createdAt;
        this.lastModifyAt = lastModifyAt;
        this.isDisable = isDisable;
        return {
            roomID: this.roomID,
            roomName: this.roomName,
            users: this.users,
            createdAt: this.createdAt,
            lastModifyAt: this.lastModifyAt,
            isDisable: this.isDisable,
        }
    }
}