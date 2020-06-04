// server
const express = require('express')
const app = express();
const bp = require('body-parser');
const multer = require('multer');
const upload = multer();
app.set('domain', process.argv.slice(2)[0]);
console.log(app.get('domain'))
module.exports.app = app;

// database and data flow
const fs = require('fs');
const db = require('./server/db.js');
const Account = db.Account;
const _root = db.Root;
var validate = require('./res/js/validate.js');

// https and socket server and mailer
const https = require('https').createServer({
    key : fs.readFileSync(__dirname+'/ssl/server.key'),
    cert : fs.readFileSync(__dirname+'/ssl/server.cert')
}, app);
const io = require('socket.io')(https);
module.exports.io = io;

// routes saved externally
const regHandler = require('./server/route.reg.js');
const loginHandler = require('./server/route.login.js');
const queryHandler = require('./server/route.query.js').route;
const lobbyHandler = require('./server/route.lobby.js');
const roomHandler = require('./server/route.room.js');
const fdbHandler = require('./server/route.feedback.js');

app.use(express.static(__dirname+'/'))

app.get('/', function(req, res){
    res.redirect('/login');
})

app.get('/login', function(req, res){
    res.sendFile(__dirname+'/views/_login.html');
})

app.post('/login/:id', upload.array(), loginHandler)

app.get('/reg', function(req, res){
    res.sendFile(__dirname+'/views/_reg.html');
})

app.post('/signup', upload.array(), regHandler.registration)

app.get('/confirm', regHandler.verification)

app.get('/me', function(req, res){
    res.sendFile(__dirname+'/views/_dash.html');
})

app.get('/lobby', lobbyHandler)

app.get('/room/:num', roomHandler.roomRoute)

app.get('/query/:func/:key', queryHandler)

app.get('/rules', function(req, res){
    res.sendFile(__dirname+'/views/_rules.html');
})

app.get('/contact', function(req, res){
    res.sendFile(__dirname+'/views/_contact.html')
})

app.post('/feedback', upload.array(), fdbHandler)

https.listen('5000', function(){
    console.log('Running ...')
})