var express = require('express'),
    _       = require('lodash'),
    config  = require('../config'),
    jwt     = require('jsonwebtoken'),
    ejwt    = require('express-jwt'),
    db      = require('../db');

var app = module.exports = express.Router();

// var jwtCheck = ejwt({
//   secret: config.secretKey
// });

//app.use('/analytics/private', jwtCheck);

app.get('/analytics/risk-types', function(req, res) {
  db.get().query(`SELECT 		  SUBSTRING(rt.risk_type_name, 1, 12) label
                              , count(r.risk_id) value
                   FROM		    risks r
                   INNER JOIN	risk_types rt ON r.risk_type_id = rt.risk_type_id
                   GROUP BY 	rt.risk_type_id;`, function(err, rows, fields) {
    if (err)
        return res.status(400).send({ 
          error: "Unable to fetch risk types analytics", 
          details: err 
      });

    res.status(200).send(rows);
  });
});

app.get('/analytics/risk-categories', function(req, res) {
  db.get().query(`SELECT 		SUBSTRING(rc.risk_category_name, 1, 12) label
                                , count(r.risk_id) value
                   FROM		    risks r
                   INNER JOIN	risk_categories rc ON r.risk_category_id = rc.risk_category_id
                   GROUP BY 	rc.risk_category_id;`, function(err, rows, fields) {
    if (err)
        return res.status(400).send({ 
          error: "Unable to fetch risk categories analytics", 
          details: err 
      });

    res.status(200).send(rows);
  });
});

app.get('/analytics/projects', function(req, res) {
  db.get().query(`SELECT 		  p.project_name label
                              , count(r.risk_id) value
                   FROM		    risks r
                   INNER JOIN	risk_identifications ri ON ri.risk_id = ri.risk_id
                   INNER JOIN	projects p ON ri.project_id = p.project_id
                   GROUP BY 	p.project_id;`, function(err, rows, fields) {
    if (err)
        return res.status(400).send({ 
          error: "Unable to fetch projects analytics", 
          details: err 
      });

    res.status(200).send(rows);
  });
});

app.get('/analytics/activities', function(req, res) {
  db.get().query(`SELECT 		  a.activity_title label
                              , count(r.risk_id) value
                   FROM		    risks r
                   INNER JOIN	risk_identifications ri ON ri.risk_id = ri.risk_id
                   INNER JOIN	activities a ON a.activity_id = ri.activity_id
                   GROUP BY 	a.activity_id;`, function(err, rows, fields) {
    if (err)
        return res.status(400).send({ 
          error: "Unable to fetch activities analytics", 
          details: err 
      });

    res.status(200).send(rows);
  });
});