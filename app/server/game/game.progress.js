const gameComp = require('./game.comp.js');
const pile = gameComp.pile,
      deck = gameComp.deck,
      parseCard = gameComp.parseCard,
      parseComp = gameComp.parseComp;
const e = require('./events.js').Events;
const query = require('../route.query.js').func;

class Game {
    #io;
    #deck;
    constructor(roomName){
        this.specialId = roomName;
        this.#deck = new deck();
        this.playersReady = false;
        this.gameStateEnded = false;
        this.players = {
            len : 0
        };
        this.playerData = {};
        this.breakerIndex;
        this.turnIndex;
        this.playerCount = 4;
        this.trump;
        this.playedSet = [];
        this.setCollected = [0, 0, 0, 0];
        var self = this;
        this.readyFn;
        this.endFn;
        this.getPlayerIndexBySocketId = function(sid){
            for(var j = 0; j < this.players.len; j++){
                if (this.players[j].socket.id == sid){
                    return j
                }
            }
            return null 
        }
        this.bindSocketToGame = function(sockObj, i){
            sockObj.on(e.rec.card_played, (obj)=>{
                obj = JSON.parse(obj);
                this.#io.emit(e.send.other_played, obj);
                this.chance(obj)
            })
            sockObj.on(e.rec.player_details, ()=> {
                this.#io.to(sockObj.id).emit(e.send.player_details, JSON.stringify(this.playerData))
            });
            sockObj.on(e.rec.quit, (ind)=> {
                this.#io.emit(e.send.quit, ind);
                self.gameStateEnded = true;
                self.declareWinner(ind)
            })
            sockObj.on('disconnect', function(){
                if(self.gameStateEnded == false){
                    var disconnId = sockObj.id;
                    var disconnIndex = self.getPlayerIndexById(disconnId, true)
                    var ticks = 0;
                    var timerId = setInterval(function(){
                        function _newId(){
                            try {
                                return self.players[disconnIndex].socket.id; 
                            } catch(e){
                                _newId()
                            }
                        }
                        var newId = _newId();
                        if(ticks <= 40){
                            if(newId != disconnId){
                                clearInterval(timerId);
                            }
                            ticks++;
                        } else {
                            clearInterval(timerId);
                            self.gameStateEnded = true;
                            self.declareWinner(disconnIndex)
                        }
                    }, 500)
                }
            })
        };
        this.informChance = function(i){
            i = i%this.playerCount;
            this.#io.emit(e.send.others_turn, i);
            this.#io.to(this.players[i].socket.id).emit(e.send.player_turn, true);
            }
        this.currentSet = {
            index : [],
            card : [],
            num : [],
            suit : []
        };
        this.declareHigherCard = function(setObj){ 
            var winIndex;
            if(setObj.suit.indexOf(self.trump) > -1){
                var trumpNums = [];
                setObj.suit.forEach(function(el, i){
                    if(el == self.trump){
                        trumpNums.push(setObj.num[i])
                    }
                })
                winIndex = setObj.card.indexOf(parseComp(Math.max(...trumpNums),self.trump));
            } else {
                var suitNums = [];
                var activeSuit = setObj.suit[0];
                setObj.suit.forEach(function(el, i){
                    if(el == activeSuit){
                        suitNums.push(setObj.num[i])
                    }
                })
                winIndex = setObj.card.indexOf(parseComp(Math.max(...suitNums),activeSuit))
            }
            return setObj.index[winIndex]
        }
        this.declareWinner = function(quitIndex){
            if(this.gameStateEnded){
                if(quitIndex == undefined){
                    var team1 = this.setCollected[0]+this.setCollected[2];
                    var team2 = this.setCollected[1]+this.setCollected[3];
                    var winner;
                    if (team1 > team2){
                        winner = self.players[0].name+' and '+self.players[2].name;
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, winner);
                    } else {
                        winner = self.players[1].name+' and '+self.players[3].name;
                        query('gameresult', self.players[0].key, false)
                        query('gameresult', self.players[1].key, true)
                        query('gameresult', self.players[2].key, false)
                        query('gameresult', self.players[3].key, true)
                        this.#io.emit(e.send.winner, winner)
                    }
                } else {
                    var winner;
                    if(quitIndex%2 == 0){
                        winner = self.players[1].name+' and '+self.players[3].name;
                        query('gameresult', self.players[0].key, false)
                        query('gameresult', self.players[1].key, true)
                        query('gameresult', self.players[2].key, false)
                        query('gameresult', self.players[3].key, true)
                        this.#io.emit(e.send.winner, winner);
                    } else {
                        winner = self.players[0].name+' and '+self.players[2].name;
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, winner);
                    }
                }
                setTimeout(()=>{
                    this.endFn();
                }, 1000)
            }
        }
        return this.specialId;
    }

    onReady(fn){
        this.readyFn = fn.bind(this);
    }

    onEnd(fn){
        this.endFn = fn;
    }
    
    join(playerObj, s){
        var self = this;
        if(!this.playersReady){
            var playerIndex = this.players.len;
            this.bindSocketToGame(s, playerIndex);
            s.emit(e.send.player_index, playerIndex);
            // assign index to player
            playerObj.index = playerIndex;
            // save transaction-key before deleting
            var specialKey = playerObj.key;
            // save player-id (unique) before deleting
            var playerId = playerObj.id;
            // delete transaction-key and player-id
            delete playerObj['key']; delete playerObj['id'];
            this.playerData[playerIndex] = playerObj;
            var _player = {};
            _player.id = playerId;
            _player.name = playerObj.name;
            _player.cards = new pile();
            _player.socket = {};
            _player.socket.obj = s;
            _player.socket.id = playerObj.sid;
            _player.key = specialKey;
            this.players[playerIndex] = _player;
            this.players.len++;
            query('gamefee', specialKey);
            this.#io.to(playerObj.sid).emit(e.send.player_details, JSON.stringify(this.playerData));
            this.playersReady = playerIndex == this.playerCount-1 ? true : false; 
            this.playersReady ? this.readyFn() : null; 
        } else {
            var joinedPlayerId = playerObj.id;
            var joinedPlayerIndex = this.getPlayerIndexById(joinedPlayerId)
            if(joinedPlayerIndex > -1){
                s.emit(e.send.player_index, joinedPlayerIndex);
                var joinedPlayer = this.players[joinedPlayerIndex];
                joinedPlayer.key = playerObj.key;
                joinedPlayer.socket.obj = s;
                joinedPlayer.socket.id = s.id;
                this.#io.to(joinedPlayer.socket.id).emit(e.send.player_details, JSON.stringify(this.playerData))
                this.bindSocketToGame(s, joinedPlayerIndex);
                if(!this.trump){
                    if (this.breakerIndex == joinedPlayerIndex){
                        this.#io.to(joinedPlayer.socket.id).emit(e.send.breaker, this.breakerIndex);
                        this.#io.to(joinedPlayer.socket.id).emit(e.send.cards_five, joinedPlayer.cards.$pile);
                        joinedPlayer.socket.obj.on(e.rec.trump_selected, (trumpSuit) => {
                            this.setTrump = trumpSuit;
                        })
                    }
                } else {
                    var gameStateData = JSON.stringify({
                        activeSuit : self.currentSet.suit[0] || null,
                        setCollected : self.setCollected[joinedPlayerIndex],
                        trumpSuit : self.trump,
                        chanceIndex : self.turnIndex%self.playerCount,
                        cardsPlayed : {
                            index : self.currentSet.index,
                            cards : self.currentSet.card
                        }
                    })
                    this.#io.to(joinedPlayer.socket.id).emit(e.send.remaining_cards, joinedPlayer.cards.$pile);
                    this.#io.to(joinedPlayer.socket.id).emit(e.send.game_state, gameStateData)
                }
            }
        }
    }

    bindTo(nsp){
        this.#io = nsp;
    }

    set breaker(ind){
        this.#io.emit(e.send.player_details, JSON.stringify(this.playerData));
        this.breakerIndex = ind;
        this.turnIndex = ind;
        this.#io.emit(e.send.breaker, ind);
        this.breakingCards();
    }

    breakingCards(){
        for(var i = 0; i < this.players.len; i++){
            var el = this.players[i];
            el.cards.putin(this.#deck.draw(5));
            this.#io.to(el.socket.id).emit(e.send.cards_five, el.cards.$pile)
        }
        this.players[this.breakerIndex].socket.obj.on(e.rec.trump_selected, (trumpSuit)=>{
            this.setTrump = trumpSuit;
        })
    }
    
    set setTrump(s){
        if(s == 'H' || s == 'S' || s == 'C' || s == 'D'){
            this.trump = s;
            this.#io.emit(e.send.trump_selected, s);
            this.turnIndex = this.breakerIndex+1;
            this.distributeRestCards();
        } else {
            // action to be taken if the input is any thing other than these four
        }
    }

    distributeRestCards(){
        var cardsRemaining = (52-(5*this.playerCount))/this.playerCount;
        for(var i = 0; i < cardsRemaining; i++){
            for (var j = 0; j < this.players.len; j++){
                var el = this.players[j];
                el.cards.putin(this.#deck.draw(1))
                this.#io.to(el.socket.id).emit(e.send.rest_cards, el.cards.$pile)
            }
        }
        this.informChance(this.turnIndex);
    }

    chance(chanceObj){
        var self = this;
        if(this.turnIndex%this.playerCount == chanceObj.index && this.gameStateEnded == false){
            this.players[chanceObj.index].cards.throwout(chanceObj.card);
            this.currentSet.index.push(chanceObj.index);
            this.currentSet.card.push(chanceObj.card);
            var cardComp = parseCard(chanceObj.card)
            this.currentSet.num.push(cardComp.num);
            this.currentSet.suit.push(cardComp.suit);
            if(this.currentSet.index.length == this.playerCount){
                this.playedSet.push(this.currentSet);
                this.turnIndex = this.declareHigherCard(this.currentSet);
                this.setCollected[this.turnIndex]++;
                setTimeout(() => {this.#io.emit(e.send.set_result, this.turnIndex)}, 500);
                if (this.playedSet.length == 13 && this.gameStateEnded == false){
                    this.gameStateEnded = true;
                    setTimeout(() => {this.declareWinner()}, 800);
                }
                this.currentSet.index = [], this.currentSet.card= [], this.currentSet.num = [], this.currentSet.suit = [];
            } else {
                this.turnIndex++;
            }
            setTimeout(()=>{this.informChance(this.turnIndex)}, 800)
        }
    }

    getPlayerIndexById(uid, sid){
        for(var i = 0; i < this.players.len; i++){
            var playerId = sid ? this.players[i].socket.id : this.players[i].id;
            if(playerId == uid){
                return i;
            }
        }
        return -1;
    }
}

module.exports = Game;