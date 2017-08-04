var env = process.env.NODE_ENV || 'development';
console.log('env *****', env);

var mysql = require('mysql');
var pool  = null;

switch(env) {
    case 'development':
        process.env.PORT = 3000;

        var dbconfig = {
            connectionLimit : 100,
            host     : '127.0.0.1',
            user     : 'root',
            password : 'Rkl@2015',
            database : 'prp',
            debug    :  false
        };
        break;
    case "test":
        // to do
        break;
    default:
        // https://stark-cliffs-54398.herokuapp.com/
        var dbconfig = {
            connectionLimit : 100,
            host     : 'us-cdbr-iron-east-03.cleardb.net',
            user     : 'b544072879e803',
            password : '8de4e484',
            database : 'heroku_45af283e6046208',
            debug    :  false
        };
}

exports.connect = function() {
  pool = mysql.createPool(dbconfig);
}

exports.get = function() {
   return pool;
}