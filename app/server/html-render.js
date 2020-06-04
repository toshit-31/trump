const fs = require('fs')
module.exports = function(fileName, vars, cb){
    let htmlString;
    fs.readFile(__dirname+'/../'+fileName, function(err, data){
        if (!err){
            htmlString = data.toString();
            for (var i in vars) {
                var htmlString = htmlString.replace(new RegExp('{{'+i+'}}', 'gi'), vars[i]);
            }
            cb(htmlString);
        } else {
            throw Error(err);
        }
    });
}