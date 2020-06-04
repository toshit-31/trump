window.$user = {};
function updateInfo(data){
    document.title = 'Personal Lobby - '+data.basic[0].display_name
    window.$user.name = data.basic[0].display_name;
    window.$user.dp = data.basic[0].display_pic;
    window.$user.id = localStorage.getItem('userId');
    var info = document.querySelector('.info');
    info.querySelector('#_name').innerHTML = data.basic[0].display_name;
    info.querySelector('img').src = 'res/avs/'+data.basic[0].display_pic;
    info.querySelector('#_points').value = data.game[0].game_bal;
    info.querySelector('#_gwin').value = data.game[0].game_won;
    info.querySelector('#_gloss').value = data.game[0].game_lost;
}
function exit(d){
        localStorage.clear();
        window.location = d+'/login'
}
function emailToId(str){
    str = btoa(str);
    str = str.replace(/\//g, '-');
    str = str.replace(/\+/g, '--');
    str = str.replace(/=/g, ' ').trim();
    return str;
}
window.addEventListener('load', function(){
    window.$domain = window.location.protocol+'//'+window.location.host;
    // render vue zone
    new Vue({
        el : '#vue-wrap',
        data : {
            roomName : null
        }, 
        methods : {
            joinLobby : function(){
                if(this.roomName != '' && this.$refs.jroom.open == false){
                    this.$refs.jroom.roomName = this.roomName
                    this.$refs.jroom.join();
                    document.getElementById('jr').classList.add('_loader')
                }
            },
            openLobby : function(){
                if(this.$refs.croom.open == false){
                    this.$refs.croom.create();
                    document.getElementById('cr').classList.add('_loader')
                }
            }
        }
    })
    // after the vue zone is rendered add details of the game to the user
    document.querySelector('#_logout').addEventListener('click', function(){
        exit(window.$domain)
    });
    var secretKey = localStorage.getItem('bG9nZ2VkaW51c2Vy'); // loggedinuser in base64 encoding
    (function getPLayerInfo(){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', window.$domain+'/query/useraccount/'+secretKey);
        xhr.send();
        xhr.onreadystatechange = function(){
            this.readyState == 4 ? (() => {
                var resp = JSON.parse(this.response);
                try {
                    localStorage.setItem('userName', resp.basic[0].display_name);
                    localStorage.setItem('userDP', resp.basic[0].display_pic);
                    var encodedId = emailToId(resp.basic[0].unique_name)
                    localStorage.setItem('userId', encodedId);
                    updateInfo(resp);
                } catch(e) {
                    getPLayerInfo();
                }
            })() : false
        }
    })()
})