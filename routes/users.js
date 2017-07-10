var express = require('express'),
    _       = require('lodash'),
    config  = require('../config'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    md5    = require('md5'),
    db      = require('../db');

var app = module.exports = express.Router();

var jwtCheck = ejwt({
  secret: config.secretKey
});

function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secretKey, { expiresIn: 60*60 });
}

function login(userEmail, userPassword, done) {
  db.get().query(`SELECT user_id userId, user_name userName, user_email userEmail 
                   FROM users WHERE user_email = ? and user_password = ? LIMIT 1`, [userEmail, userPassword], function(err, rows, fields) {
    if (err) throw err;
    done(rows[0]);
  });
}

function findUsers(done) {
  db.get().query(`SELECT user_id userId , user_name userName, user_email userEmail, user_password userPassword
                   FROM users`, function(err, rows, fields) {
    if (err) throw err;
    done(rows);
  });
}

app.post('/users/new', function(req, res) {  
  if (!req.body.userName || !req.body.userPassword) {
    return res.status(400).send({"error": true, "details": 'Email and password required'});
  }
  
  user = {
    user_name: req.body.userName,
    user_email: req.body.userEmail,
    user_password: md5(req.body.userPassword)
  };
  
  db.get().query('INSERT INTO users SET ?', [user], function(err, result){
    if (err) 
        return res.status(400).send({"error": true, "details": err});

    newUser = {
      user_name: user.user_name,
      user_email: user.user_email,
      user_password: user.user_password
    };
    res.status(201).send({
      user: {
        userName: user.user_name,
        userEmail: user.user_email
      },
      id_token: createToken(newUser)
    });
  });
});

app.post('/users/login', function(req, res) {
  login(req.body.userEmail, md5(req.body.userPassword), function(user){
    console.log(user);

    if (!user)
      return res.status(404).send();

    res.status(201).send({
      user: {
        userName: user.userName,
        userEmail: user.userEmail
      },
      id_token: createToken(user)
    });
  });
});

app.use('/private', jwtCheck);

app.get('/private/users', function(req, res) {
  findUsers(function(result) {
      res.status(200).send(result);
  });
});