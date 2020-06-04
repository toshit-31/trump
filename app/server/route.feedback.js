const fs = require('fs');
const path = require('path');

module.exports = function(req, res){
    var mailName = req.body.email.replace('@', '_');
    var senderName = req.body.name;
    var msg = req.body.msg;
    fs.writeFileSync(path.join(__dirname, '../../fdbs/', mailName+'.txt'), `--${senderName}--\n${msg}`);
    res.sendStatus(200)
}