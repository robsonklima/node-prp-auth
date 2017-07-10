var mysql = require('mysql');
var pool  = null;
var dbConfig = null;

// exports.connect = function() {
//   pool = mysql.createPool({
//     connectionLimit : 100,
//     host     : 'localhost',
//     user     : 'root',
//     password : '',
//     database : 'prp'
//   });
// }

exports.connect = function() {
  pool = mysql.createPool({
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

