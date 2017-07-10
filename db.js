var mysql = require('mysql');
var pool  = null;
var dbConfig = null;

var env = process.env.NODE_ENV || 'development';
console.log('env *****', env);

switch(env) {
    case 'development':
        process.env.PORT = 3000;
        dbConfig = {
          connectionLimit : 100,
          host     : 'localhost',
          user     : 'root',
          password : '',
          database : 'prp'
        }
        break;
    case "test":
        // to do
        break;
    default:
        // stark-cliffs-54398
        dbconfig = {
          connectionLimit : 100,
          host     : 'us-cdbr-iron-east-03.cleardb.net',
          user     : 'b544072879e803',
          password : '8de4e484',
          database : 'heroku_45af283e6046208',
          debug    :  false
        };
}

exports.connect = function() {
  pool = mysql.createPool(dbconfig = {
          connectionLimit : 100,
          host     : 'us-cdbr-iron-east-03.cleardb.net',
          user     : 'b544072879e803',
          password : '8de4e484',
          database : 'heroku_45af283e6046208',
          debug    :  false
        });
}

exports.get = function() {
   return pool;
}