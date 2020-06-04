// load basic game data same as on dashboard page
(function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    var transactionKey = localStorage.getItem('bG9nZ2VkaW51c2Vy'); // loggedinuser in base64 encoding
    var userId = localStorage.getItem('userId');
    var userDp = localStorage.getItem('userDP');
    var userName = localStorage.getItem('userName');
    if (!(transactionKey && userId && userDp && userName)){
        window.location = window.$domain+'/me'
    }
}());
window.addEventListener('load', function(){
    window.$server = null; // create global access of server
    window.$player = {}; // other connected players
    window.$me = null; // client self
    // accessory functions
    (async () => {
        document.getElementById('')
    })();
    function clearCardArea(){
        document.getElementById('pl-top-card').innerHTML = ''
        document.querySelector('#pl-lr-card .-l').innerHTML = ''
        document.querySelector('#pl-lr-card .-r').innerHTML = ''
        document.getElementById('pl-me-card').innerHTML = ''
    };
    window.$msg = document.getElementById('vol-msg');
    function volatileMsg(header, message, timeInSec){
        window.$msg.setAttribute('data-head', header);
        window.$msg.innerHTML = message;
        window.$msg.style.display = 'block';
        window.$msg.style.animation = 'linear '+timeInSec+'s fade-out'
        setTimeout(()=>{
            window.$msg.style.display = 'none';
            window.$msg.style.animation = 'none';
        }, 1000*timeInSec)
    }
    // creating param for self
    var disp = {
        id : localStorage.getItem('userId'),
        name : localStorage.getItem('userName'),
        dp : localStorage.getItem('userDP'),
        key : localStorage.getItem('bG9nZ2VkaW51c2Vy'),
        sid : null
    };
    var socket = io;
    var roomNum = window.location.pathname;
    document.title = 'Room - '+roomNum.slice(6);
    // connecting to namepsace of the room
    socket = socket.connect(roomNum);
    var server = new Server(socket);
    window.$server = server;
    socket.on('connect', function(){
        disp.sid = socket.id;
        // initialising self 
        window.$me = new Me(disp);
        // tell server player is ready
        server.send(Server.send.player_ready, window.$me.playerDetail)
    })
    // receive player details
    server.listen(Server.rec.player_details, (dataPlayers)=>{
        if(window.$me.gameStarted == false){
            window.$player = {};
            var slots = ['pl-me', 'pl-left', 'pl-top', 'pl-right'];
            dataPlayers = JSON.parse(dataPlayers);
            Object.keys(dataPlayers).forEach(function(el){
                if(el != window.$me.index){
                    window.$player[el] = new Player(dataPlayers[el])
                    var slotIndex = parseInt(el)-window.$me.index;
                    if(slotIndex < 0){
                        slotIndex += 4;
                    }
                    window.$player[el].setSlot = slots[slotIndex]
                }
            })
            if(Object.keys(window.$player).length == 3){
                window.$me.gameStarted = true;
            }
        }
    })
    // set the index of self
    server.listen(Server.rec.player_index, function(dataIndex){
        window.$me.playerIndex = parseInt(dataIndex);
        server.send(Server.send.player_details, '1');
    })
    // set the player as breaker if the data matches from server
    server.listen(Server.rec.breaker, function(data){
        if (data == window.$me.index){
            volatileMsg('Caller', '<b>You</b> are the caller', 2)
            window.$me.caller = true;
        } else {
            volatileMsg('Caller', '<b>'+window.$player[data].name+'</b> is calling', 4)
        }
    });
    // distribute first 5 cards to breaker and show cards to breaker only
    server.listen(Server.rec.cards_five, function(cardsArr){
        window.$me.emptyCardStack();
        cardsArr.forEach(c => {
            var newCard = new Card(c);
            newCard.addListener(function(e){
                var self = this;
                window.$me.playChance(self.card);
            })
            window.$me.addCard(newCard)
        })
        // show card only if the player is breaker 
        // else hide from all other players until the trump is decided  
        if (window.$me.caller == true){
            window.$me.showCards();
            window.$me.trumpSelection();
        }
    })
    server.listen(Server.rec.trump_selected, function(data){
        var __suits = {
            'H' : 'Hearts', 'D' : 'Diamonds', 'S' : 'Spades', 'C' : 'Clubs'
        }
        window.$me.trumpCard = data;
        window.$me.trump = data;
        var suitIcon = __suits[data] == 'Diamonds' ? 'diams' : __suits[data].toLowerCase();
        volatileMsg('Trump Suit', `Trump suit is <b>&${suitIcon}; ${__suits[data]}</b>`, 3)
    })
    // receive the rest cards and show all the cards to all
    server.listen(Server.rec.rest_cards, function(cardsArr){
        // receive single card
        var restCards = cardsArr.slice(-1)
        restCards.forEach(c => {
            var newCard = new Card(c)
            newCard.addListener(function(e){
                var self = this;
                window.$me.playChance(self.card);
            })
            window.$me.addCard(newCard);
        })
        // show card one by one
        window.$me.showCards();
        window.$me.gameStateLoaded = true;
    })
    // inform the player about its chance and make changes
    server.listen(Server.rec.player_turn, function(data){
        if(window.$me.gameStateLoaded == true){
            if (data.toString() == 'true'){
                window.$me.enableChance();
            }
        }
    })
    // inform the player about others turn
    server.listen(Server.rec.others_turn, function(data){
        if(data != window.$me.index){
            window.$player[data].startTimer();
        }
    })
    // listen to chance played by other player
    server.listen(Server.rec.other_played, function(data){
        if (window.$me.activeSuit == null){
            window.$me.activeSuit = parseCard(data.card).suit.toLowerCase();
        }
        if(data.index != window.$me.index){
            window.$player[data.index].stopTimer();
        }
        var _cont = window.$player?.[data.index]?.slot || 'pl-me';
        if (_cont == 'pl-left'){
            _cont = '#pl-lr-card .-l';
        } else if (_cont == 'pl-right'){
            _cont = '#pl-lr-card .-r';
        } else {
            _cont = '#'+_cont+'-card';
        }
        new PlayedCard(data.card, _cont)
    })
    //listen to result of each set
    server.listen(Server.rec.set_result, function(data){
        window.$me.activeSuit = null;
        if(data == window.$me.index){
            window.$me.setInc();
            volatileMsg('Set To', `<b>You</b> won this turn`, 0.8);
        } else {
            volatileMsg('Set To', `<b>${window.$player[data].name}</b> won this turn`, 0.8);
        }
        clearCardArea();
    });
    //send forfiet req
    document.getElementById('_ft').addEventListener('click', function(){
        server.send(Server.send.quit, window.$me.index, function(){
            window.location = window.$domain+'/me'
        })
    })
    //---------------------------------------
    //events to listen to socket on reconnect
    //---------------------------------------
    // update collected set
    server.listen(Server.rec.game_state, function(data){
       gameData = JSON.parse(data);
       if(gameData.activeSuit != null){
           gameData.activeSuit = gameData.activeSuit.toLowerCase()
       }
       window.$me.activeSuit = gameData.activeSuit;
       window.$me.sets = gameData.setCollected;
       window.$me.trump = gameData.trumpSuit;
       window.$me.gameStateLoaded = true;
       if(window.$me.index == gameData.chanceIndex){  
            window.$me.enableChance()
       }
       gameData.cardsPlayed.index.forEach(function(plIndex, i){
            var _card = gameData.cardsPlayed.cards[i];
            var _cont = window.$player?.[plIndex]?.slot || 'pl-me';
            if (_cont == 'pl-left'){
                _cont = '#pl-lr-card .-l';
            } else if (_cont == 'pl-right'){
                _cont = '#pl-lr-card .-r';
            } else {
                _cont = '#'+_cont+'-card';
            }
            new PlayedCard(_card, _cont)
       })
    });
    // listen for card status
    server.listen(Server.rec.remaining_cards, function(cardsArr){
        window.$me.emptyCardStack();
        cardsArr.forEach(c => {
            var newCard = new Card(c)
            newCard.addListener(function(e){
                var self = this;
                window.$me.playChance(self.card);
            })
            window.$me.addCard(newCard);
        })
        // show card one by one
        window.$me.showCards();
    })
    //---------------------------------------
    //send forfiet req
    server.listen(Server.rec.quit, function(data){
        alert(window.$player[data].name+' quit')
    })
    // make changes when the game finishes
    server.listen(Server.rec.winner, function(data){
        server.close();
        window.$me.emptyCardStack();
        clearCardArea();
        volatileMsg('Winner', `<b>${data} won</b>`);
        document.getElementById('cd-show').classList.add('win-ann')
        document.getElementById('cd-show').innerHTML = data+' won';
        setTimeout(()=>{
            window.location = window.$domain+'/me';
        }, 4000)
    })
})