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