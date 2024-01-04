module.exports = class UserModel {
    constructor(userID, img, name, isDisable, isAdmin) {
        this.userID = userID;
        this.img = img ? img : 'https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/systemStorage%2Fdefault-user-image.png?alt=media&token=4ab3a931-55af-4c57-98d7-5fb9f82850a2';
        this.name = name ? name : '';
        // this.reqRes = reqRes ? reqRes : [];
        // this.reqSend = reqSend ? reqSend : [];
        // this.friends = friends ? friends : [];
        // this.chatRooms = chatRooms ? chatRooms : [];
        // this.blockList = blockList ? blockList : [];
        this.isDisable = isDisable;
        this.isAdmin = isAdmin;
        this.joinAt = Date.now();
        return {
            userID: this.userID,
            img: this.img,
            name: this.name,
            isDisable: this.isDisable,
            isAdmin: this.isAdmin,
            joinAt: this.joinAt,
        };
    }
}
