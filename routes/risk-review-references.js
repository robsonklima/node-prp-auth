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

app.get('/risk-review-references', function(req, res) {
  db.get().query(`SELECT        risk_review_references_id riskReviewReferenceId
                                , risk_review_references_title riskReviewReferenceTitle
                                , risk_review_references_type riskReviewReferenceType
                                , risk_review_references_weight riskReviewReferenceWeight
                    FROM        risk_review_references
                    ORDER BY risk_review_references_weight, risk_review_references_title`, function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});