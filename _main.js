window.addEventListener('load', function(){
    var resDisplay = document.getElementById('q_res');
    document.getElementById('q_btn').addEventListener('click', function(e){
        resDisplay.innerHTML = '';
        var queryInput = document.getElementById('_q').value;
        if(queryInput == ''){
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://127.0.0.1:3000/account');
            xhr.send();
            xhr.onreadystatechange = function(){
                if (this.readyState == 4){
                    var accounts = JSON.parse(this.response);
                    accounts.forEach(function(acc){
                        acc = acc.replace(/=/g, '_');
                        var _xhr = new XMLHttpRequest();
                        _xhr.open('GET', 'http://127.0.0.1:3000/account/'+acc);
                        _xhr.send();
                        _xhr.onreadystatechange = function(){
                            if (this.readyState == 4){
                                var resp = JSON.parse(this.response);
                                resp.forEach(elm => {
                                    var userCardCont = document.createElement('div');
                                    userCardCont.id = acc;
                                    var userCard = document.createElement('user-detail');
                                    userCard.setAttribute('mail', elm.basic.unique_name);
                                    userCard.setAttribute('name', elm.basic.display_name);
                                    userCard.setAttribute('dp', elm.basic.display_pic);
                                    userCard.setAttribute('bal', elm.game.game_bal);
                                    userCard.setAttribute('won', elm.game.game_won);
                                    userCard.setAttribute('loss', elm.game.game_lost);
                                    userCardCont.appendChild(userCard)
                                    resDisplay.appendChild(userCardCont);
                                })
                                new Vue({
                                    el : '#q_res #'+acc
                                })
                            }
                        }
                    })
                }
            }
        } else {
            queryInput = btoa(queryInput)
            e.target.classList.add('_loader');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://127.0.0.1:3000/account/'+queryInput);
            xhr.send();
            xhr.onreadystatechange = function(){
                if (this.readyState == 4){
                    e.target.classList.remove('_loader');
                    var resp = JSON.parse(this.response);
                    resp.forEach(el => {
                        var userCard = document.createElement('user-detail');
                        userCard.setAttribute('mail', el.basic.unique_name);
                        userCard.setAttribute('name', el.basic.display_name);
                        userCard.setAttribute('dp', el.basic.display_pic);
                        userCard.setAttribute('bal', el.game.game_bal);
                        userCard.setAttribute('won', el.game.game_won);
                        userCard.setAttribute('loss', el.game.game_lost);
                        resDisplay.appendChild(userCard);
                    })
                    new Vue({
                        el : '#q_res'
                    })
                }
            }
        }
    })
})