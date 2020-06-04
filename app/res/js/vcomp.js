window.$domain = window.location.protocol+'//'+window.location.host;
const createLobby = Vue.component('create-lobby', {
    template : `<div id= 'lb-create' v-bind:class= {active:open}>
    <div class= 'cont'>
    <h2>Room : {{roomName}}</h2>
    <button class= 'btn' id= 'stroom' v-on:click= 'start()'>Start Game</button>
    <button class= 'btn' id= 'dbroom' v-on:click= 'cancel()'>Disband Room</button>
    <p v-html= 'tagHTML'></p>
    </div>
    </div>`,
    data : function(){
        return {
            open : false,
            roomName : null,
            joinedPlayers : null, // {name, displayPic}
            tagHTML : '',
            socket : null,
            lobbyEvents : {
                rec : {
                    join_field : 0x5,
                    room_not_full : 0x3,
                    kick:0x1,
                    room_ref_leader : 0x6,
                    room_ref : 0x7,
                    room_closed : 0x8
                },
                send : {
                    room_joined : 0x0,
                    start : 0x4,
                    kick : 0x2
                }
            }
        }
    },
    methods : {
        create : function(){
            var _xhr = new XMLHttpRequest();
            _xhr.open('get', window.$domain+'/lobby?cr=1');
            _xhr.send();
            var self = this;
            var lobbyEvt = this.lobbyEvents;
            _xhr.onreadystatechange = function(){
                self.joinedPlayers = this.readyState == 4 ? (()=>{
                    // random room id received from server
                    self.roomName = this.response;
                    self.open = true;
                    // dom changes
                    document.getElementById('stroom').innerHTML = 'Start Game'
                    document.getElementById('stroom').classList.remove('_loader');
                    document.getElementById('stroom').disabled = false;
                    document.getElementById('dbroom').disabled = false;
                    // connect to room
                    _socket = io.connect('/bG9iYnk='+this.response); // lobby in base64
                    // save socket id and room name in localStorage
                    _socket.on('connect', function(){
                        localStorage.setItem('c29ja2V0LWlk', _socket.id); // socket-id in base64
                    });
                    localStorage.setItem('room', self.roomName)
                    self.socket = _socket;
                    // player has joined lobby
                    _socket.emit(lobbyEvt.send.room_joined, JSON.stringify(window.$user));
                    // lobby closed
                    _socket.on(lobbyEvt.rec.room_closed, function(){
                        localStorage.removeItem('room');
                        _socket.disconnect();
                    });
                    _socket.on(lobbyEvt.rec.room_ref_leader, function(data){
                        data = String(data)
                        var parsedData = JSON.parse(data);
                        window.roomie = parsedData;
                        self.update();
                    });
                    _socket.on(lobbyEvt.rec.join_field, function(data){
                        var roomId = localStorage.getItem('room');
                        var connectionId = localStorage.getItem('userId').replace('#', '-');
                        window.location = window.$domain+'/room/'+roomId+'?id='+connectionId
                    });
                    _socket.on(lobbyEvt.rec.room_not_full, function(data){
                        document.getElementById('stroom').innerHTML = 'Start Game'
                        document.getElementById('stroom').classList.remove('_loader');
                        document.getElementById('stroom').disabled = false;
                        document.getElementById('dbroom').disabled = false;
                        alert('Cannot start. Room not full')
                    });
                })() : null;
            }
        },
        cancel : function(){
            this.open = false;
            /*
            var _xhr = new XMLHttpRequest();
            _xhr.open('GET', window.$domain+'/lobby?cl=1&rn='+this.roomName);
            _xhr.send();
            */
            localStorage.removeItem('room');
            document.getElementById('cr').classList.remove('_loader');
        },
        update : function(){
            var self = this;
            this.tagHTML = ''
            for (var p of window.roomie){
                var temp;
                if (p.name.search('admin') > 0){
                    var temp = `<p class= 'pl-tag'><img src= 'res/avs/${p.dp}' align= 'center'>${p.name}</p>`
                } else {
                    p.sid = p.sid.split('#')[1];
                    var temp = `<p class= 'pl-tag'><img src= 'res/avs/${p.dp}' align= 'center'>${p.name}<button class= 'btn _kick' id= '${p.sid}' onclick= 'kick(this)'>remove</button></p>`
                }
                this.tagHTML += temp;
            }
            window.kick = function(x){
                self.socket.emit(self.lobbyEvents.send.kick, '/bG9iYnk='+self.roomName+'#'+x.id);
            }
        },
        start : function(){
            this.socket.emit(this.lobbyEvents.send.start, self.roomName)
            document.getElementById('stroom').innerHTML = 'Starting'
            document.getElementById('stroom').classList.add('_loader');
            document.getElementById('stroom').disabled = true;
            document.getElementById('dbroom').disabled = true;
        }
    }
});
const joinLobby = Vue.component('join-lobby', {
    template : `<div id= 'lb-create' v-bind:class= {active:open}>
    <div class= 'cont'>
    <h2>Room : {{roomName}}</h2>
    <button class= 'btn' v-on:click= 'leave()'>Leave Room</button>
    <p v-html= 'tagHTML'></p>
    </div>
    </div>`,
    data : function(){
        return {
            open : false,
            roomName : null,
            tagHTML : '',
            socket : null,
            lobbyEvents : {
                rec : {
                    join_field : 0x5,
                    room_not_full : 0x3,
                    kick:0x1,
                    room_ref_leader : 0x6,
                    room_ref : 0x7,
                    room_closed : 0x8
                },
                send : {
                    room_joined : 0x0,
                    start : 0x4,
                    kick : 0x2
                }
            }
        }
    },
    methods : {
        join : function(){
            var _xhr = new XMLHttpRequest();
            _xhr.open('GET', window.$domain+'/lobby?jr='+this.roomName);
            _xhr.send();
            var lobbyEvt = this.lobbyEvents;
            var self = this;
            _xhr.onreadystatechange = function(){
                this.readyState == 4 ? (()=>{
                    var exists = this.response;
                    if (exists == 'true') {
                        self.open = true;
                        var _socket = io.connect('/bG9iYnk='+self.roomName);
                        _socket.on('connect', function(){
                            localStorage.setItem('c29ja2V0LWlk', _socket.id); // socket-id in base64
                        });
                        localStorage.setItem('room', self.roomName)
                        self.socket = _socket;
                        _socket.emit(lobbyEvt.send.room_joined, JSON.stringify(window.$user));
                        _socket.on(lobbyEvt.rec.room_closed, function(){
                            document.getElementById('jr').classList.remove('_loader');
                            self.open = false;
                        });
                        _socket.on(lobbyEvt.rec.room_ref, function(data){
                            data = String(data)
                            var parsedData = JSON.parse(data);
                            window.roomie = parsedData;
                            self.update();
                        });
                        _socket.on(lobbyEvt.rec.kick, function(data){
                            window.roomie = null;
                            self.open = false;
                            self.socket.disconnect();
                            alert('You were kicked');
                            document.getElementById('jr').classList.remove('_loader');
                        });
                        _socket.on(lobbyEvt.rec.join_field, function(data){
                            var roomId = localStorage.getItem('room');
                            var connectionId = localStorage.getItem('userId');
                            window.location = window.$domain+'/room/'+roomId+'?id='+connectionId
                        });
                    } else {
                        alert(`Room ${self.roomName} was not created`)
                        document.getElementById('jr').classList.remove('_loader');
                    }
                    })() : false;
            }
        },
        leave : function(){
            this.open = false;            
            this.socket.disconnect();
            localStorage.removeItem('c29ja2V0LWlk');
            localStorage.removeItem('room');
            document.getElementById('jr').classList.remove('_loader');
        },
        update : function(){
            this.tagHTML = ''
            for (var p of window.roomie){
                var temp = `<p class= 'pl-tag'><img src= 'res/avs/${p.dp}' align= 'center'>${p.name}</p>`
                this.tagHTML += temp;
            }
        }
    }
})