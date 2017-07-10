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

app.get('/risks', function(req, res) {
  db.get().query(`SELECT    r.risk_id riskId
                            , r.risk_title riskTitle
                            , r.risk_cause riskCause
                            , r.risk_effect riskEffect
                            , r.risk_added_date riskAddedDate
                            , r.risk_category_id riskCategoryId
                            , rc.risk_category_name riskCategoryName    
                            , r.risk_type_id riskTypeId
                            , rt.risk_type_name riskTypeName
                   FROM 	risks r, risk_types rt, risk_categories rc
                   WHERE	r.risk_type_id = rt.risk_type_id
                   AND	    r.risk_category_id = rc.risk_category_id
                   ORDER BY r.risk_title`, function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});

app.get('/risks/:riskId', function(req, res) {
  db.get().query(`SELECT  risk_id riskId
                          , risk_title riskTitle
                          , risk_cause riskCause
                          , risk_effect riskEffect
                          , risk_added_date riskAddedDate
                          , risk_type_id riskTypeId
                          , risk_category_id riskCategoryId
                   FROM   risks
                   WHERE  risk_id = ?`, [req.params.riskId], function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});

app.post('/risks', function(req, res) {  
  risk = {
    risk_title: req.body.riskTitle,
    risk_cause: req.body.riskCause,
    risk_effect: req.body.riskEffect,
    risk_type_id: req.body.riskTypeId,
    risk_category_id: req.body.riskCategoryId,
    risk_added_date: new Date()
  };

  db.get().query('INSERT INTO risks SET ?', [risk], function(err, result){ 
    if (err) 
        return res.status(400).send({"error": true, "details": err});

    res.status(200).send(project);
  });
});

app.put('/risks/:riskId', function(req, res) {  
  risk = {
    risk_title: req.body.riskTitle,
    risk_cause: req.body.riskCause,
    risk_effect: req.body.riskEffect,
    risk_type_id: req.body.riskTypeId,
    risk_category_id: req.body.riskCategoryId
  };

  db.get().query('UPDATE risks SET ? WHERE risk_id = ?', [risk, req.params.riskId], function(err, result){ 
    if (err) 
        return res.status(400).send({"error": true, "details": err});

    res.status(200).send(risk);
  });
});

app.delete('/risks/:riskId', function(req, res) {  
  db.get().query('DELETE FROM risks WHERE risk_id = ?', [req.params.riskId], function(err, result){ 
    if (err) 
        return res.status(400).send({"error": true, "details": err});

    res.status(200).send();
  });
});