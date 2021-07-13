const mongo = require('mongodb').MongoClient;
const express = require('express');
const app = express();
const _url = 'mongodb://127.0.0.1:27017/', _opts = {
    useUnifiedTopology : true,
    keepAlive : false, 
    auth: {
        user : "root-admin",
        password : "this.is.my.first.application"
    }
};

app.use(express.static(__dirname));

app.get('/', function(req, res){
    res.sendFile(__dirname+'/index.html')
})

app.get('/account/:id', function(req, res){
    var userMail = req.params.id.replace(/_/g, '=');
    mongo.connect(_url, _opts, function(err, client){
        if (err){
            res.sendStatus(500)
        } else {
            var db = client.db(userMail);
            var info = {};
            db.collections(function(err, result){
                result.forEach((el, i, arr)=>{
                    el.findOne(function(err, _res){
                        var collName = el.namespace.split('.')[1];
                        if (collName != 'creds'){
                            info[collName] = _res;
                        }
                        if(arr.length-1 == i){
                            res.send([info])
                            client.close()
                        }
                    })
                })
            })
        }
    })
})

app.get('/account', function(req, res){
    var info = [];
    mongo.connect(_url, _opts, function(err, client){
        if(err){
            res.sendStatus(500)
        } else {
            var db = client.db('admin');
            var userList = db.collection('system.users');
            userList.find({db : {$not : /admin/}}).toArray(function(err, result){
                result.forEach(function(el, i, arr){
                    info.push(el.db)
                    if(i == arr.length-1){
                        res.send(info);
                        client.close();
                    }
                })
            })
        }
    })
})

app.put('/change/:id', function(req, res){
    var userId = req.params.id;
    var changed = {
        name : req.query.name,
        balance : parseInt(req.query.bal)
    };
    mongo.connect(_url, _opts, function(err, client){
        if(err){
            res.sendStatus(500)
        } else {
            var db = client.db(userId);
            try {
                db.collection('basic').updateOne({}, {$set : {display_name : changed.name}}, function(e, res){
                    if (e) {
                        throw e
                    }
                });
                db.collection('game').updateOne({}, {$set : {game_bal : changed.balance}}, function(e, res){
                    if (e) {
                        throw e
                    }
                });
                res.sendStatus(200)
            } catch(e) {
                res.sendStatus(500)
            }
        }
    })
})

app.delete('/delete/:id', function(req, res){
    var userid64 = req.params.id;
    var userid = Buffer.from(userid64, 'base64').toString('ascii')
    mongo.connect(_url, _opts, function(err, client){
        var db = client.db(userid64);
        try {
            db.dropDatabase(function(err, res){
                if (err){
                    throw err
                }
            })
            client.db('activeUser').collection('users').deleteMany({user_id : userid}, function(err, res){
                if (err) {
                    throw err
                }
            })
            db.removeUser(userid);
            res.sendStatus(200)
        } catch(e){
            res.sendStatus(500)
        }
    })
})

app.listen(3000, function(){
    console.log('Started')
})