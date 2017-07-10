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

app.use('/risk-reviews', jwtCheck);

app.get('/risk-reviews/:userId', function(req, res) {
  db.get().query(`SELECT 		ri.risk_identification_id riskIdentificationId
                                , r.risk_id riskId
                                , r.risk_title riskTitle
                                , r.risk_cause riskCause
                                , r.risk_effect riskEffect
                                , p.project_id projectId
                                , p.project_name projectName
                                , p.project_scope projectScope
                                , a.activity_id activityId
                                , a.activity_title activityTitle
                                , u.user_id userId
                                , u.user_name userName
                                , rr.risk_review_added_date riskReviewAddedDate
                  FROM 		      risk_identifications ri
                  INNER JOIN	  risks r on r.risk_id = ri.risk_id
                  LEFT JOIN	    projects p on p.project_id = ri.project_id
                  LEFT JOIN	    activities a on a.activity_id = ri.activity_id
                  INNER JOIN	  users u on u.user_id = ri.user_id
                  LEFT JOIN		  risk_reviews rr ON rr.risk_identification_id = ri.risk_identification_id
                  WHERE		      u.user_id = ?
                  ORDER BY 	  	r.risk_title, p.project_name`, [req.params.userId], function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});

app.post('/risk-reviews', function(req, res) {  
  riskReview = {
    risk_review_cost: req.body.riskReviewCost,
    risk_review_schedule: req.body.riskReviewSchedule,
    risk_review_scope: req.body.riskReviewScope,
    risk_review_quality: req.body.riskReviewQuality,
    risk_review_probability: req.body.riskReviewProbability,
    risk_identification_id: req.body.riskIdentificationId,
    user_id: req.body.userId,
    risk_review_added_date: new Date()
  };

  db.get().query('INSERT INTO risk_reviews SET ?', [riskReview], function(err, result){ 
    if (err)
        return res.status(400).send({"error": true, "details": err});

    res.status(200).send(riskReview);
  });
});