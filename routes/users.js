var express = require('express'),
    _       = require('lodash'),
    config  = require('../config'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    md5     = require('md5'),
    db      = require('../db');

var app = module.exports = express.Router();

var jwtCheck = ejwt({
  secret: config.secretKey
});

function createToken(user) {
  return jwt.sign(_.omit(user), config.secretKey, { expiresIn: 60*60*5 });
}

function login(userEmail, userPassword, done) {
  db.get().query(`SELECT  user_id userId
                          , user_name userName
                          , user_email userEmail 
                   FROM users WHERE user_email = ? and user_password = ? LIMIT 1`, 
                   [userEmail, userPassword], function(err, rows, fields) {
    if (err) throw err;
    done(rows[0]);
  });
}

app.post('/users/login', function(req, res) {
  login(req.body.userEmail, md5(req.body.userPassword), function(user){
    if (!user)
      return res.status(400).send({ error: "Email or password invalid" });

    res.status(201).send({
      user: {
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        userToken: createToken(user)
      }
    });
  });
});

app.post('/users', function(req, res) {  
  if (!req.body.userName || !req.body.userPassword) {
    return res.status(400).send({ error: "Email and password required" });
  }

  user = {
    user_name: req.body.userName,
    user_email: req.body.userEmail,
    user_password: md5(req.body.userPassword)
  };
  
  db.get().query('INSERT INTO users SET ?', [user], function(err, result){
    if (err) 
        return res.status(400).send({"error": true, "details": err});

    res.status(201).send({
      user: {
        userName: user.user_name,
        userEmail: user.user_email,
        userToken: createToken(user)
      }
    });
  });
});

app.get('/users', function(req, res) {
  db.get().query(`SELECT  user_id userId 
                          , user_name userName
                          , user_email userEmail
                          , user_password userPassword
                   FROM users`, function(err, rows, fields) {
     if (err)
        return res.status(400).send();

     res.status(200).send(rows);
  });
});