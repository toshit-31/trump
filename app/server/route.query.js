const db = require('./db.js');
const Account = db.Account;
const _root = db.Root;

const funcList = {

    findlog(arg, resp){
        _root.findActiveUser(arg, function(found){
            found != false ? resp.send(true) : resp.send(false)
        })
    },

    useraccount(arg, resp) {
        _root.findActiveUser(arg, function(res){
            const user = new Account(res.user_id, res.user_pass);
            user.exists().then(f => {
                if (f == true){
                    user.getData().then(det => {
                        resp.send(det)
                    }).catch(e => {
                        resp.sendStatus(500)
                    })
                } else {
                    throw e
                }
            }).catch(err=>{
                resp.sendStatus(500)
            })
        })
    },

    basicuser(arg, resp) {
        _root.findActiveUser(arg, function(res){
            const user = new Account(res.user_id, res.user_pass);
            user.exists().then(f => {
                if (f == true){
                    user.getData('basic').then(det => {
                        resp.send(det)
                    }).catch(e => {
                        resp.sendStatus(500)
                    })
                } else {
                    throw e
                }
            }).catch(err=>{
                resp.sendStatus(500)
            })
        })
    },
    gamefee(arg){
        _root.findActiveUser(arg, function(res){
            const user = new Account(res.user_id, res.user_pass);
            user.exists().then(f => {
                if (f == true){
                    user.getData('game').then(det => {
                        var oldVal = det[0].game_bal;
                        var newVal = parseInt(oldVal)-50;
                        user.writeData('game', {
                            game_bal : newVal
                        }).then(det => {
                            
                        }).catch(e => {
                            throw e
                        })
                    }).catch(e=>{
                        throw e
                    })
                } else {
                    throw e
                }
            }).catch(err=>{
                throw err
            })
        })
    },
    gameresult(arg, won){
        _root.findActiveUser(arg, function(res){
            const user = new Account(res.user_id, res.user_pass);
            user.exists().then(f => {
                if (f == true){
                    user.getData('game').then(det => {
                        var oldVal = {
                            bal : parseInt(det[0].game_bal),
                            won : parseInt(det[0].game_won),
                            lost : parseInt(det[0].game_lost)
                        };
                        var newVal = {}
                        if(won){
                            newVal.game_won = oldVal.won+1;
                            newVal.game_bal = oldVal.bal+100
                        } else {
                            newVal.game_lost = oldVal.lost+1
                        }
                        user.writeData('game', newVal).then(det => {
                            
                        }).catch(e => {
                            throw e
                        })
                    }).catch(e=>{
                        throw e
                    })
                }
            }).catch(err=>{
                throw err
            })
        })
    },
}

module.exports.route = function(req, res){
    var arg = req.params.key;
    var funcName = req.params.func;
    funcList[funcName](arg, res)
}
module.exports.func = function(func, arg1, arg2){
    funcList[func](arg1, arg2)
}