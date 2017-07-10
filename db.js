var mysql = require('mysql');
var pool  = null;
var dbConfig = null;

exports.connect = function(port) {

  switch(port) {
    case 3000:
          var dbconfig = {
              connectionLimit : 100,
              host     : 'localhost',
              user     : 'root',
              password : '',
              database : 'prp',
              debug    :  false
          };
          break;
      default:
          // blooming-anchorage-34827
          var dbconfig = {
              connectionLimit : 100,
              host     : 'us-cdbr-iron-east-03.cleardb.net',
              user     : 'ba696071e24aa5',
              password : '7787d06f',
              database : 'heroku_b6000df02e9dd77',
              debug    :  false
          };
  }
 
}

// exports.connect = function() {
//   pool = mysql.createPool({
//     connectionLimit : 100,
//     host     : 'us-cdbr-iron-east-03.cleardb.net',
//     user     : 'b544072879e803',
//     password : '8de4e484',
//     database : 'heroku_45af283e6046208',
//     debug    :  false
//   });
// }

exports.get = function() {
   return pool;
}

