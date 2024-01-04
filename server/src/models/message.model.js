const messDataType = {
    text: 0,
    img: 1,
    vid: 2,
}
export default class MessageModel {
    
    constructor(messID, roomID, message, type, sendBy, createAt){
        this.messID = messID;
        this.roomID = roomID;
        this.message = message;
        this.type = type;
        this.sendBy = sendBy;
        this.createAt = createAt;
        return {
            messID: this.messID,
            roomID: this.roomID,
            message: this.message,
            type: this.type,
            sendBy: this.sendBy,
            createAt: this.createAt,
        }
    }
}