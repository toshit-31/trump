var playingRooms = {};
const io = require('../main.js').io;
const Game = require('./game/game.progress.js');
const path = require('path');
const e = require('./game/events.js').Events;
function bindNspToGame(nsp, _game, endCb){
    // this.breaker is a starter for game
    // and bind to function attahes the particular game to particular room
    _game.bindTo(nsp)
    _game.onReady(function(){
        this.breaker = parseInt((Math.random()*100)%2);
    });
    _game.onEnd(function(){
        endCb();
    })
    // when a player connects to the specific room it tells the game that 
    // the player joined using game.join function
    nsp.on('connect', function(s){
        s.on(e.rec.player_ready, function(data){
            _game.join(data, s)
        });
    })
}

const util = {
    addToRoom : function(roomObj){
        var rn = roomObj.roomId;
        // roomObj -> {roomId, members, connectedIds}
        // add objects to roomObj in this route
        roomObj.gameState = new Game(rn); // creating a new game with special id as room id
        roomObj.nsp = io.of('/room/'+rn); // adding socket communication nsp
        // roomObj -> {roomId : string, members : Object, connectedIds : Array, gameState : Game, nsp : Socket.Namespace}
        playingRooms[rn] = roomObj;
        // delete room
        function deleteRoom(roomId){
            try {
                if(playingRooms[roomId].gameState.gameStateEnded == true){
                    delete playingRooms[roomId]
                }
            } catch (e){
                console.log('> room already deleted');
            }
        }
        bindNspToGame(roomObj.nsp, roomObj.gameState, deleteRoom.bind(null, rn));
    },
    checkElegibility : function(roomId, connId){
        if(playingRooms.hasOwnProperty(roomId)){
            if(playingRooms[roomId].connectedIds.indexOf(connId) > -1){
                return true
            } else return false
        } else return false
    }
};
module.exports.addToRoom = util.addToRoom;
module.exports.roomRoute = function(req, res){
    var rid = req.params.num;
    var cid = req.query.id;
    if(rid && cid){
        var canJoin = util.checkElegibility(rid, cid);
        canJoin ? (()=>{
            res.sendFile(path.join(__dirname, '../views/_game.html'))
        })() : res.send('NOT ELLIGIBLE');
    } else
    res.send('NOT ALLOWED');
}