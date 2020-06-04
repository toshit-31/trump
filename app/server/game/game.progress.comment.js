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
        this.#deck = new deck(); // new deck of 52 cards for each game
        this.gameStateEnded = false;
        this.players = {
            len : 0
        }; // format {name: <username>, id: <socket-id>, cards: <pile>}
        this.playerData = {}; // to be sent on connected
        this.breakerIndex; // breakers index from this.players
        this.turnIndex; // index of current active player
        this.playerCount = 2; // no of players
        this.trump; // trump suit
        this.playedSet = []; // sets that have been played
        this.setCollected = [0, 0, 0, 0]
        this.playersReady = false; // set to true when the player length is 4
        var self = this;
        this.readyFn;this.endFn;
        this.getPlayerIndexBySocketId = function(sid){
            for(var j = 0; j < this.players.len; j++){
                if (this.players[j].socket.id == sid){
                    return j
                }
            }
            return null 
        }
        this.bindSocketToGame = function(sockObj, i){
            // listen to card played by the player
            sockObj.on(e.rec.card_played, (obj)=>{
                console.log(obj)
                obj = JSON.parse(obj);
                // emit the played card to other players
                this.#io.emit(e.send.other_played, obj);
                /**/console.log(`> ${this.players[obj.index].name} played ${obj.card}`);
                // play chance
                this.chance(obj)
            })
            // listen to the event player asking for others detail
            // send the data to specific client
            sockObj.on(e.rec.player_details, ()=> {
                this.#io.to(sockObj.id).emit(e.send.player_details, JSON.stringify(this.playerData))
            });
            sockObj.on(e.rec.quit, (ind)=> {
                this.#io.emit(e.send.quit, ind);
                self.declareWinner
            })
            // add a quiter function when the socket disconnects
            sockObj.on('disconnect', function(){
                var ind = i;
                self.declareWinner(ind);
            })
        };
        this.informChance = function(i){
            i = i%this.playerCount;
            // inform others about his chance (for the purpose of timer)
            this.#io.emit(e.send.others_turn, i);
            // inform the the ith player about its chance
            this.#io.to(this.players[i].socket.id).emit(e.send.player_turn, true);
            /**/console.log(`> ${this.players[i].name}'s chance`);
        }
        this.currentSet = {
            index : [],
            card : [],
            num : [],
            suit : []
        }; // contains card to determine winner
        // Auto-play feature on the server side -- later implementation
        /*
        this.hasSuit = function(i){
            var _suits = this.players[i].cards.$pile.map(el=>parseCard(el).suit)
            return new Set([..._suits]);
        }
        this.selectCard = function(i){
            var activeSuit = this.currentSet.suit[0];
            if(!activeSuit || !this.hasSuit(i).has(activeSuit)){
                return this.players[i].cards.$pile[0];
            } else {
                var cardsAvailable = this.players[i].cards.$pile;
                for(var j = 0; j < cardsAvailable.length; j++){
                    if(parseCard(cardsAvailable[j]).suit == activeSuit){
                        return cardsAvailable[j]
                    }
                }
            }
        }
        this.autoPlay = function(i){
            var selectedCard = this.selectCard(i);
            var initSetCount = this.playedSet.length;
            var self = this;
            var timerId = setTimeout(function(){
                console.log('> setCount', initSetCount, self.playedSet.length)
                if(initSetCount == self.playedSet.length){
                    if(i == self.turnIndex%self.playerCount){
                        console.log(`> Auto played ${self.players[i]}'s chance`)
                        self.chance({index : i, card : selectedCard})
                    }
                }
            }, 7000)
        }
        */
        this.declareHigherCard = function(setObj){ // function to check higher card and sort winner
            var winIndex;
            if(setObj.suit.indexOf(self.trump) > -1){ // search for trump suit
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
            if(!this.gameStateEnded){
                if(!quitIndex){
                    var team1 = this.setCollected[0]+this.setCollected[2];
                    var team2 = this.setCollected[1]+this.setCollected[3];
                    if (team1 > team2){
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, "0,2");
                    } else {
                        query('gameresult', self.players[0].key, false)
                        query('gameresult', self.players[1].key, true)
                        query('gameresult', self.players[2].key, false)
                        query('gameresult', self.players[3].key, true)
                        this.#io.emit(e.send.winner, "1,3")
                    }
                } else {
                    var winTeam = quitIndex%2 == 1 ? 'odd' : 'even';
                    if(winTeam == 'odd'){
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, "0,2");
                    } else {
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, "0,2");
                    }
                }
                this.gameStateEnded = true;
                this.endFn();
            }
        }
        return this.specialId;
    }

    onReady(fn){
        // calling this function binds the game to namespace and keeps the context to game
        this.readyFn = fn.bind(this);
        /**/console.log(`> Game Started`)
    }

    onEnd(fn){
        this.endFn = fn.bind(this);
    }
    
    // playerObj {name, socketid (sid), cards : <pile>}
    join(playerObj, s){
        if(!this.playersReady){
            // assign index
            var playerIndex = this.players.len;
            // attach socket listener to sokcet of respective player
            this.bindSocketToGame(s, playerIndex);
            // add shared player detail in this.playerData
            playerObj.index = playerIndex;
            var specialKey = playerObj.key;
            delete playerObj['key'];
            this.playerData[playerIndex] = playerObj;
            // create player detail and push to this.players
            var _player = {};
            _player.name = playerObj.name;
            _player.cards = new pile();
            _player.socket = {};
            _player.socket.obj = s;
            _player.socket.id = playerObj.sid;
            _player.key = specialKey;
            this.players[playerIndex] = _player;
            this.players.len++;
            console.log(specialKey)
            query('gamefee', specialKey);
            // send playerData to the currently joining socket
            this.#io.to(playerObj.sid).emit(e.send.player_details, JSON.stringify(this.playerData));
            this.playersReady = playerIndex == this.playerCount-1 ? true : false; // ready the game when fourth player joins the game
            this.playersReady ? this.readyFn() : null;
            return playerIndex; // assign same no to the client as index in the playerObj 
        } 
    }

    bindTo(nsp){
        // save namespace of socket in game instance
        this.#io = nsp;
    }

    set breaker(ind){
        // send playerData to the currently joining socket
        this.#io.emit(e.send.player_details, JSON.stringify(this.playerData));
        // set breaker
        this.breakerIndex = ind;
        this.turnIndex = ind;
        /**/console.log(`> Breaker is ${this.players[ind].name}`);
        this.#io.emit(e.gameInst, 'Breaker is '+this.players[ind].name)
        this.#io.to(this.players[ind].socket.id).emit(e.send.breaker, ind);
        this.breakingCards();
    }

    breakingCards(){
        // five cards to be given to each player and the breaker decides the trump suit
        /**/console.log(`> breaking cards distributed`);
        for(var i = 0; i < this.players.len; i++){
            var el = this.players[i];
            el.cards.putin(this.#deck.draw(5));
            this.#io.to(el.socket.id).emit(e.send.cards_five, el.cards.$pile)
        }
        // listen to selected trump and set the trump to games instance
        this.players[this.breakerIndex].socket.obj.on(e.rec.trump_selected, (trumpSuit)=>{
            /**/console.log(`> ${trumpSuit} is trump suit`);
            this.setTrump = trumpSuit;
        })
    }
    
    set setTrump(s){
        if(s == 'H' || s == 'S' || s == 'C' || s == 'D'){
            // set trump
            this.trump = s;
            this.#io.emit(e.send.trump_selected, s);
            // set the turn of next player
            this.turnIndex = this.breakerIndex+1;
            /**/console.log(`> ${this.players[this.turnIndex%this.playerCount].name} is starting`);
            // distrubute rest of the cards to other players
            this.distributeRestCards();
        } else {
            // action to be taken if the input is any thing other than these four
        }
    }

    distributeRestCards(){
        // distibute rest of the cards among the players
        var cardsRemaining = (52-(5*this.playerCount))/this.playerCount;
        for(var i = 0; i < cardsRemaining; i++){
            for (var j = 0; j < this.players.len; j++){
                var el = this.players[j];
                el.cards.putin(this.#deck.draw(1))
                this.#io.to(el.socket.id).emit(e.send.rest_cards, el.cards.$pile)
            }
        }
        /**/console.log(`> rest of the cards distributed`);
        this.informChance(this.turnIndex);
    }

    // chance object {index, card} 
    chance(chanceObj){
        var self = this;
        if(this.turnIndex%this.playerCount == chanceObj.index){
            //this.autoPlay(this.turnIndex%this.playerCount);
            this.players[chanceObj.index].cards.throwout(chanceObj.card);
            this.currentSet.index.push(chanceObj.index);
            this.currentSet.card.push(chanceObj.card);
            var cardComp = parseCard(chanceObj.card)
            this.currentSet.num.push(cardComp.num);
            this.currentSet.suit.push(cardComp.suit);
            if(this.currentSet.index.length == this.playerCount){
                this.playedSet.push(this.currentSet); // push the details of current set into played set
                this.turnIndex = this.declareHigherCard(this.currentSet); // declare winner of the set
                this.setCollected[this.turnIndex]++;
                //this.#io.emit(e.gameInst, 'The set was won by '+this.players[this.turnIndex].name)
                this.#io.emit(e.send.set_result, this.turnIndex);
                if (this.playedSet.length == 13 && this.gameStateEnded == false){
                    var team1 = this.setCollected[0]+this.setCollected[2];
                    var team2 = this.setCollected[1]+this.setCollected[3];
                    if (team1 > team2){
                        query('gameresult', self.players[0].key, true)
                        query('gameresult', self.players[1].key, false)
                        query('gameresult', self.players[2].key, true)
                        query('gameresult', self.players[3].key, false)
                        this.#io.emit(e.send.winner, "0,2");
                    } else {
                        query('gameresult', self.players[0].key, false)
                        query('gameresult', self.players[1].key, true)
                        query('gameresult', self.players[2].key, false)
                        query('gameresult', self.players[3].key, true)
                        this.#io.emit(e.send.winner, "1,3")
                    }
                    this.gameStateEnded = true;
                    this.onGameEnd();
                }
                this.currentSet.index = [], this.currentSet.card= [], this.currentSet.num = [], this.currentSet.suit = []; // reset the current set value receiver
            } else {
                this.turnIndex++;
            }
            this.informChance(this.turnIndex);
        }
    }

    playedGames(){
        console.log(this.playedSet)
    }
}

module.exports = Game;

/*
const p1 = {
    'name' : "Toshit",
    'sid' : "id1",
}
const p2 = {
    'name' : "Faisal",
    'sid' : "id2",
} 
const p3 = {
    'name' : "Deepesh",
    'sid' : "id3",
} 
const p4 = {
    'name' : "Mohit",
    'sid' : "id4",
}

var g = new Game();
g.join(p1);
g.join(p2);
g.join(p3);
g.join(p4);
g.breaker = 2;
g.breakingCards();
g.setTrump = 'D';
g.distributeRestCards();
console.log(g.players[2].cards.$pile[0], g.players[3].cards.$pile[0], g.players[0].cards.$pile[0], g.players[1].cards.$pile[0])
var c1 = {
    index : 2,
    card : g.players[2].cards.$pile[0]
}
var c2 = {
    index : 3,
    card : g.players[3].cards.$pile[0]
}
var c3 = {
    index : 0,
    card : g.players[0].cards.$pile[0]
}
var c4 = {
    index : 1,
    card : g.players[1].cards.$pile[0]
}
g.chance(c1);
g.chance(c2);
g.chance(c3);
g.chance(c4);
c1 = {
    index : 0,
    card : g.players[0].cards.$pile[0]
}
c2 = {
    index : 1,
    card : g.players[1].cards.$pile[0]
}
c3 = {
    index : 2,
    card : g.players[2].cards.$pile[0]
}
c4 = {
    index : 3,
    card : g.players[3].cards.$pile[0]
}
g.playedGames()
*/