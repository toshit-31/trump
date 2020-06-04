const io = require('../main.js').io;
const startRoom = require('./route.room.js').addToRoom;
var activeRooms = {};

const util = {
    generateRoom(){
        var rn = parseInt(Math.random()*Math.pow(10, 7))
        activeRooms.hasOwnProperty(rn) ? this.generateRoom() : false;
        return rn;
    },
    getPlayerIdfromSocketId(members, _sid){
        var players = Object.keys(members);
        for(var i = 0; i < players.length; i++){
            var playerSid = members[players[i]].sid;
            if(playerSid == _sid){
                return players[i];
            }
        }
        return null
    }
}
const lobbyEvents = {
    rec : {
        room_joined : 0x0,
        start : 0x4,
        kick : 0x2
    },
    send : {
        join_field : 0x5,
        room_not_full : 0x3,
        kick:0x1,
        room_ref_leader : 0x6,
        room_ref : 0x7,
        room_closed : 0x8
    }
}

class Room {
    #nsp;
    #memDetailLeader;
    constructor(n){
        this.roomNum = n;
        this.#nsp = io.of('/bG9iYnk='+this.roomNum);
        this.members = {};
        // members : {id, name, dp, sid}
        this.roundInfo;
        this.started = false;
        this.leader;
        this.leaderId;
        var self = this;
        this.playerCount = 0;
        this.#nsp.on('connect', function(s){
            s.on(lobbyEvents.rec.room_joined, function(playerData){
                playerData = JSON.parse(playerData)
                if (self.playerCount <= 4){
                    playerData = Object.assign(playerData, {sid : s.id})
                    if(self.playerCount == 0){
                        self.leader = playerData.id;
                        self.leaderId = playerData.sid;
                        playerData.name = playerData.name+' (admin)';
                        s.on(lobbyEvents.rec.start, function(){
                            if(self.playerCount == 4) {
                                var obj = {};
                                obj.roomId = self.roomNum;
                                obj.members = self.members;
                                //connectedIds is array of email of the connected (unique) players
                                obj.connectedIds = Object.keys(self.members);
                                startRoom(obj);
                                setTimeout(()=>{
                                    self.#nsp.emit(lobbyEvents.send.join_field, '1');
                                }, 1000)
                            } else {
                                self.#nsp.to(self.leaderId).emit(lobbyEvents.send.room_not_full, '1');
                            }
                        })
                    } else {
                        playerData.name = playerData.name
                    }
                    self.members[playerData.id] = playerData;
                    self.playerCount++;
                    self.#nsp.emit(lobbyEvents.send.room_ref_leader, JSON.stringify(Object.values(self.members)))
                    self.#nsp.emit(lobbyEvents.send.room_ref, JSON.stringify(Object.values(self.members)))
                    s.on(lobbyEvents.rec.kick, function(kickId){
                        if (self.leaderId == s.id){
                            var _id = util.getPlayerIdfromSocketId(self.members, kickId);
                            console.log(_id)
                            self.#nsp.to(self.members[_id].sid).emit(lobbyEvents.send.kick, '1');
                        }
                    })
                    s.on('disconnect', () => {
                        if(s.id == self.leaderId){
                            self.delete();
                        } else {
                            s.disconnect();
                            self.playerCount--;
                            delete self.members[util.getPlayerIdfromSocketId(self.members, s.id)];
                            self.#nsp.emit(lobbyEvents.send.room_ref_leader, JSON.stringify(Object.values(self.members)))
                            self.#nsp.emit(lobbyEvents.send.room_ref, JSON.stringify(Object.values(self.members)))
                        }
                    })
                } else {
                    s.disconnect();
                }
            })
        })
    }

    delete(){
        var self = this;
        this.#nsp.emit(lobbyEvents.send.room_closed, '1');
        delete activeRooms[this.roomNum];
    }
}

module.exports = function(req, res){
    var createRoom = parseInt(req.query.cr) | 0;
    var joinRoom = parseInt(req.query.jr) | false;
    var cancelRoom = parseInt(req.query.cl) | 0;
    if (createRoom && !joinRoom) {
        var randomRoomNo = util.generateRoom();
        activeRooms[randomRoomNo] = new Room(randomRoomNo);
        res.send(String(randomRoomNo))
    } 
    if(cancelRoom) {
        var roomNum = parseInt(req.query.rn) | false;
        if(roomNum){
            if(activeRooms.hasOwnProperty(roomNum)){
                activeRooms[roomNum].delete();
                res.sendStatus(200)
            } else {
                res.sendStatus(404)
            }
        } else {
            res.sendStatus(404)
        }
    }
    if(joinRoom && !createRoom){
        if(activeRooms.hasOwnProperty(joinRoom)){
            res.send('true')
        } else {
            res.send('false')
        }
    }
}