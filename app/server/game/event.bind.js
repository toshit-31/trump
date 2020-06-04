const e = require('./events.js').Events;

module.exports = function(nsp, game, endCb){
    // this.breaker is a starter for game
    // and bind to function attahes the particular game to particular room
    game.bindTo(nsp)
    game.onReady(function(){
        this.breaker = parseInt((Math.random()*100)%4);
    });
    game.onEnd(function(){
        endCb();
    })
    // when a player connects to the specific room it tells the game that 
    // the player joined using game.join function
    nsp.on('connect', function(s){
        s.on(e.rec.player_ready, function(data){
            s.emit(e.send.player_index, game.join(data, s))
        });
    })
}