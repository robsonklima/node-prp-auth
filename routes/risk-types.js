var express = require('express'),
    _       = require('lodash'),
    config  = require('../config'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    db      = require('../db');

var app = module.exports = express.Router();

var jwtCheck = ejwt({
  secret: config.secretKey
});

app.use('/risk-types', jwtCheck);

app.get('/risk-types', function(req, res) {
  db.get().query(`SELECT risk_type_id riskTypeId, risk_type_name riskTypeName
                   FROM risk_types ORDER BY risk_type_name ASC`, function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});