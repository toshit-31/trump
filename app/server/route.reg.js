// renderer
const render = require('./html-render.js');
const app = require('../main.js').app;
// setup mailer
const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
    service : 'Gmail',
    auth:{
        user : 'toshit.work@gmail.com',
        pass : 'silentFighter_1131'
    }
})

//database and dataflow
const db = require('./db.js');
const Account = db.Account;
const _root = db.Root;
var validate = require('../res/js/validate.js');

// global object to store users temp
var globalUser = {};

// call back handler for /reg
module.exports.registration = function(req, res){
    const user = {
        name : req.body.name,
        id : req.body.id,
        dpChar : req.body.dp,
        id64 : Buffer.from(req.body.id).toString('base64'),
        pass : req.body.pass,
    }
    const userConstr = {
        name : {
            presence: true,
            length: {
                minimum: 6,
                maximum: 15
            },
            format : /[a-zA-z0-9_\$]+/
        },
        id:{
            presence: true,
            email:true
        },
        dpChar: {
            presence: true,
            format: /(beardMan.webp)|(nerdyGuy.png)|(punkDude.png)|(shortHairFemale.png)|(longHairWomen.png)/
        },
        pass : {
            presence:true,
            length: {
                minimum: 6,
                maximum: 20
            }
        }
    }
    var validationResult = validate(user, userConstr);
    try {
        if (!validationResult){
            var userAccount = new Account(user.id, user.pass);
            userAccount.userName = user.name;
            userAccount.charName = user.dpChar;
            globalUser[user.id64] = userAccount;
            userAccount.exists().then(function(found){
                if(!found){
                    var confLink = app.get('domain')+'/confirm?uniqueid='+user.id64;
                    var mailOpt = {
                        from: 'toshit.work@gmail.com',
                        to : user.id,
                        subject : 'Verifying Account',
                        html : `
                        <style>
                        #msg {
                            display:block;
                            padding:2em 5em;
                            margin:1em auto;
                            width:80%;
                            background-color:lightgreen;
                            box-shadow: 0 0 1px lightgreen;
                            border-radius:5px solid green;
                            color:green;
                            font-family:Raleway;
                            font-size:14px;
                            text-align:center;
                        }
                        b {
                            color: green;
                            font-weight:bold;
                        }
                        </style>
                        <h1>Verify your account @ Trump.com</h1>
                        <p>Click On the link provided below to verify your account for once and all<p>
                        <b><a href= '${confLink}'>${confLink}</a></b>
                        `
                    }
                    mailer.sendMail(mailOpt, function(err, info){
                        if (err){
                            render('views/err.html', {
                                'err_code' : err,
                                'uniqueid' : user.id
                            }, function(data){
                                res.send(data);
                            })
                        } else {
                            _root.addPending(user.id64)
                            render('views/conf.html', {
                                'uniqueid' : user.id
                            }, function(data){
                                res.send(data);
                            });
                        }
                    })
                } else {
                    render('views/accpres.html', {
                        'uniqueid' : user.id
                    }, function(data){
                        res.send(data);
                    });
                }
            }).catch((err)=>{
                render('views/err.html', {
                    'msg': 'Something didn\'t go as expected',
                    'err_code' : err
                }, function(data){
                    res.send(data);
                })
            })
        } else {
            throw Error('Bad Information')
        }
    } catch(e) {
        render('views/err.html', {
            'msg' : 'The Information provided seems to be invalid. Please try again with valid information.<br>',
            'err_code' : e
        }, function(data){
            res.send(data);
        })
    }
}

module.exports.verification = function(reqc, resc){
    _root.findPending(reqc.query.uniqueid, function(pend){
        if(pend){
            var userAccount = globalUser[reqc.query.uniqueid];
            userAccount.createUser().then(succ => {
                resc.send('YOUR ACCOUNT HAS BEEN SUCCESSFULLY CREATED. PLEASE LOGIN.')
            }).catch(err=>{
                resc.send('OOPS ! SOMETHING DIDN\'T GO AS EXPECTED. PLEASE TRY AGAIN.')
            }).finally(()=>{
                _root.deletePending(reqc.query.uniqueid);
                delete globalUser[reqc.query.uniqueid];
            })
        } else {
            resc.send('SEEMS TO BE A MADEUP LINK. ACCOUNT NOT VERIFIED. TRY MAKING AN ACCOUNT.');
        }
    });
}