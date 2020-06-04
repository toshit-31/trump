const parseCard = function(card){
    var cardSuit = card.slice(-1);
    var cardNum = card.slice(0, -1)
    if(!isNaN(cardNum)){
        cardNum = parseInt(cardNum)-1;
    } else {
        switch(cardNum){
            case 'J' : cardNum=10;break;
            case 'Q' : cardNum=11;break;
            case 'K' : cardNum=12;break;
            case 'A' : cardNum=13;break;
        }
    }
    return {
        num : cardNum,
        suit : cardSuit
    }
}
const parseComp = function(num, suit, arrBool){
    if(num <= 9){
        num++;
    } else {
        switch(num){
            case 10 : num='J';break;
            case 11 : num='Q';break;
            case 12 : num='K';break;
            case 13 : num='A';break;
        }
    }
    return arrBool ? [num,suit] : num+suit;
}
class Server {
     
    #io 

    constructor(ioobj){
        this.#io = ioobj;
    }
    
    static send = {
        trump_select : 0x1,
        card_played : 0x5,
        player_ready : 0x00,
        trump_selected : 0x8,
        player_details:0x13,
        quit:0x16
    };
    static rec = {
        cards_five: 0x7,
        player_index : 0x01,
        breaker : 0x0,
        trump_selected : 0x2,
        rest_cards : 0x3,
        game_started : 0x4,
        player_turn: 0x6,
        set_result : 0x9,
        other_played : 0x10,
        player_details : 0x12,
        others_turn : 0x14,
        winner : 0x15,
        quit : 0x17,
        game_state : 0x18,
        remaining_cards : 0x19
    };

    send(evt, data, cb){
        this.#io.emit(evt, data);
        cb ? cb() : false
    }

    listen(evt, cb){
        this.#io.on(evt, function(data){
            cb(data)
        });
    }

    close(){
        this.#io.disconnect();
    }
}
class Timer {
    #meterCont;
    #meterSlider
    constructor(slot){
        this.meterSlot = document.querySelector(slot+' ._met');
        this.meterSlot.innerHTML = '';
        this.#meterCont = document.createElement('div');
        this.#meterCont.classList.add('timer-meter');
        this.#meterSlider = document.createElement('div');
        this.#meterSlider.classList.add('fill');
        this.#meterCont.appendChild(this.#meterSlider);
        this.meterSlot.appendChild(this.#meterCont);
    }

    set value(val){
        this.#meterSlider.style.width = (val*100/20)+'%'
    }

    static MAX = 20 // in seconds
}
class Me {
    //private properties
    #card;
    #breaker;
    #chance;
    #_suit = {
        h : '&hearts;',
        s : '&spades;',
        d : '&diams;',
        c : '&clubs;',
    }

    //private methods
    #resetTimer;
    #hasSuits;
    #availCards;
    #selectCard;
    #updateTimer;
    #autoPlay;
    #audio;
    
    constructor(opt){
        this.name = opt.name;
        document.querySelector('#pl-me #_info span').innerHTML = this.name;
        this.dp = opt.dp;
        document.querySelector('#pl-me #_info img').src = '../../res/avs/'+this.dp
        this.#card = {
            cards : {},
            cardsSorted : null
        }
        this.id = opt.id
        this.sid = opt.sid;
        this.transactionKey = opt.key;
        this.gameStarted = false;
        this.gameStateLoaded = false;
        this.index;
        this.#breaker = false;
        this.trumpCard;
        this.#chance = false;
        this.activeSuit = null;
        this.setCollected = 0;
        this.#audio = new Audio('../../res/audio/set_win.wav')
        this.chanceTimerId;
        this.#hasSuits = function(){
            var len = Object.values(this.#card.cards).map(el => el.suit);
            return new Set([...len])
        };
        this.#resetTimer = function(){
            this.meter.value = Timer.MAX;
        }
        this.trumpSelection = function(){
            var suitSet = this.#hasSuits();
            var _cont = document.getElementById('trump-sel');
            suitSet.forEach(el => {
                var _btn = document.createElement('button');
                _btn.className = 'btn _suit '+el;
                _btn.value = el;
                _btn.innerHTML = this.#_suit[el];
                _cont.style.gridTemplateColumns += ' 1fr'
                _btn.addEventListener('click', function(){
                    window.$server.send(Server.send.trump_selected, this.value.toUpperCase())
                    _cont.remove();

                })
                _cont.appendChild(_btn)
            })
        }
        this.#availCards = function(){
            var self = this;
            if(this.activeSuit != null && this.#hasSuits().has(this.activeSuit)) {
                var cardLen = Object.keys(this.#card.cards);
                for(var i = 0; i < cardLen.length; i++){
                    var cardObj = this.#card.cards[cardLen[i]];
                    if(cardObj.suit == this.activeSuit){
                        cardObj.enable();
                    }
                }
            } else {
                Object.keys(this.#card.cards).forEach((el)=>{
                    self.#card.cards[el].enable();
                })
            }
        }
        this.#selectCard = function(){
            if(this.activeSuit == null || this.#hasSuits().has(this.activeSuit) == false){
                // array of cards present
                var card = Object.keys(this.#card.cards)[0];
                // selecting first value of object and accessing card property of Card class
                return this.#card.cards[card].card;
            } else {
                var cardLen = Object.keys(this.#card.cards);
                for (var i = 0; i < cardLen.length; i++){
                    var cardObj = this.#card.cards[cardLen[i]];
                    if(cardObj.suit == this.activeSuit){
                        return cardObj.card;
                    }
                }
            }
        }
        this.meter = new Timer('#pl-me #_info');
        this.timerId;
        this.#updateTimer = function(){
            this.meter.value = 0;
            var val = 0;
            var self = this;
            this.timerId = setInterval(function(){
                val += 0.5;
                self.meter.value = val;
                if(val == Timer.MAX){
                    clearInterval(self.timerId);
                    self.#resetTimer();
                }
            }, 500)
        }
        this.enableChance = function(){
            var self = this;
            this.#chance = true;
            this.#availCards();
            this.chanceTimerId = setTimeout(function(){
                if(self.#chance == true){
                    var selectedCard = self.#selectCard();
                    self.playChance(selectedCard);
                }
            }, Timer.MAX*1000)
            this.#updateTimer();
        }
    };

    set playerIndex(i){
        this.index = i
    }

    set caller(val){
        this.#breaker = true;
    }

    get caller(){
        return this.#breaker;
    }

    set trump(val) {
        var __suits = {
            'H' : 'Hearts', 'D' : 'Diamonds', 'S' : 'Spades', 'C' : 'Clubs'
        }
        this.trumpCard = val;
        var suitIcon = __suits[val] == 'Diamonds' ? 'diams' : __suits[val].toLowerCase();
        if(val == 'H' || val == 'D'){
            document.querySelector('#_game-info #tr').classList.add('r')
        }
        document.querySelector('#_game-info #tr').innerHTML = `Trump : <b>&${suitIcon}; ${__suits[val]}</b>`
    }

    set sets(val){
        this.setCollected = val;
        document.getElementById('sc').value = val;
    }

    get playerDetail(){
        return {
            id : this.id,
            name : this.name,
            dp : this.dp,
            sid : this.sid,
            key : this.transactionKey
        }
    }

    setInc(){
        this.sets = this.setCollected+1;
        this.#audio.play();
    }

    addCard(c){
        this.#card.cards[c.card] = c;
    }

    arrangeCards(){
        var cardsArr = Object.keys(this.#card.cards);
        var _suitStack = {
            h : [], d : [], s : [], c : []
        }
        var sortedCardStack = []
        cardsArr.forEach((el)=>{
            var parsedCard = parseCard(el);
            _suitStack[parsedCard.suit.toLowerCase()].push(parsedCard.num);
        })
        Object.keys(_suitStack).forEach((el)=>{
            _suitStack[el] = _suitStack[el].sort(function(a,b){
                return a-b
            })
            _suitStack[el].forEach(function(num){
                sortedCardStack.push(parseComp(num, el.toUpperCase()))
            })
        });
        this.#card.cardsSorted = sortedCardStack;
    }

    showCards(){
        var self = this;
        var cardsArr = Object.keys(self.#card.cards);
        for(var i = 0; i < cardsArr.length; i++){
            this.#card.cards[cardsArr[i]].show();
        }
    }

    emptyCardStack(){
        this.#card.cards = {}
        document.getElementById('card-stack').innerHTML = '';
    }

    playChance(card){
        var self = this;
        if (this.#chance == true){
            // remove the card visually
            this.#card.cards[card].remove();
            // delete the card from memory
            delete this.#card.cards[card];
            // disallow chance
            this.#chance = false;
            // disable all the cards after chance
            Object.keys(this.#card.cards).forEach((el)=>{
                self.#card.cards[el].disable();
            })
            // resturn obj
            var retObj = {
                index : this.index,
                card : card
            };
            // return string
            var retStr = JSON.stringify(retObj);
            // send the card
            window.$server.send(Server.send.card_played, retStr);
            clearTimeout(self.chanceTimerId);
            clearInterval(this.timerId);
            this.#resetTimer(); 
        } else {
            alert('Its not your chance')
        } 
    }
}
class Player {
    #updateTimer;

    constructor(opt){
        this.name = opt.name;
        this.dp = opt.dp;
        this.sid = opt.id;
        this.index = opt.index;
        this.slot;
        this.meter;
        this.timerId;
        this.#updateTimer = function(){
            this.meter.value = 0;
            var val = 0;
            var self = this;
            this.timerId = setInterval(function(){
                val += 0.5;
                self.meter.value = val;
                if(val == Timer.MAX){
                    clearInterval(self.timerId);
                    self.meter.value = Timer.MAX;
                }
            }, 500)
        }
    }

    set setSlot(id){
        this.slot = id;
        document.querySelector(`#${id} ._info span`).innerHTML = this.name;
        document.querySelector(`#${id} ._info img`).src = '../../res/avs/'+this.dp;
        this.meter = new Timer(`#${id} ._info`);
    }
    
    startTimer(){
        this.#updateTimer();
    }

    stopTimer(){
        clearInterval(this.timerId)
        this.meter.value = Timer.MAX;
    }
}
class Card {
    #template;
    #_suit = {
        h : '&hearts;',
        s : '&spades;',
        d : '&diams;',
        c : '&clubs;',
    }
    constructor(card){
        this.card = card;
        this.added = false;
        var parsedCard = parseCard(this.card, true);
        this.num = parseComp(parsedCard.num, null, true)[0];
        this.suit = parsedCard.suit.toLowerCase();
        this.stateEnabled = false;
        // adding card to the stack
        this.cont = document.querySelector('#card-stack');
        this.#template = `<span class= 'up'>${this.num}${this.#_suit[this.suit]}</span>
        <span class= 'mid'>${this.#_suit[this.suit]}</span>
        <span class= 'down'>${this.num}${this.#_suit[this.suit]}</span>`;
        this.el = document.createElement('div');
        this.el.classList.add('card');
        this.el.classList.add(this.suit);
        this.el.classList.add('dis');
        this.el.innerHTML = this.#template;
    }

    addListener(cb){
        var self = this;
        this.el.addEventListener('click', function(e){
            if (self.stateEnabled == true){
                cb.call(self, e);
            }
        })
    }

    show(){
        if(this.added == false){
            this.cont.appendChild(this.el);
            this.added = true;
        }
    }

    remove(){
        this.el.remove();
    }

    enable(){
        this.stateEnabled = true;
        this.el.classList.remove('dis');
    }

    disable(){
        this.stateEnabled = false;
        this.el.classList.add('dis');
    }
}
class PlayedCard {
    #template;
    #audio;
    #_suit = {
        h : '&hearts;',
        s : '&spades;',
        d : '&diams;',
        c : '&clubs;',
    }
    constructor(card, container){
        this.card = card;
        var parsedCard = parseCard(this.card, true);
        this.num = parseComp(parsedCard.num, null, true)[0];
        this.suit = parsedCard.suit.toLowerCase();
        this.cont = document.querySelector(container);
        this.#template = `<span class= 'up'>${this.num}${this.#_suit[this.suit]}</span>
        <span class= 'mid'>${this.#_suit[this.suit]}</span>
        <span class= 'down'>${this.num}${this.#_suit[this.suit]}</span>`;
        this.el = document.createElement('div');
        this.el.classList.add('card');
        this.el.classList.add(this.suit);
        this.el.innerHTML = this.#template;
        this.cont.appendChild(this.el);
        this.#audio = new Audio('../../res/audio/card_played.wav')
        this.#audio.play()
    }
}