// renderer
const render = require('./html-render.js');

//database and dataflow
const db = require('./db.js');
const Account = db.Account;
const _root = db.Root;
const validate = require('../res/js/validate.js');
const crypto = require('crypto')
const generateKey = function(){
    return crypto.randomBytes(32).toString('hex');
}
// call back handler for login

module.exports = function(req, res){
    var user = {
        id64 : req.params.id,
        pass : req.body.key,
        id : Buffer.from(req.params.id, 'base64').toString('ascii')
    }
    const userAccount = new Account(user.id || 'anonymous', user.pass || 'anonymous');
    userAccount.exists().then(found => {
        found ? (()=>{
            userAccount.getData().then(function(){
                var specialKey = generateKey();
                _root.addActiveUser(specialKey, user.id, user.pass);
                res.send(specialKey);
            }).catch((e)=>{
                res.send('0')
            })
        })() : res.send('0')
    }).catch(err => {
        res.send('1');
    })
}