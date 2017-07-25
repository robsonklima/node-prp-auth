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

app.use('/risk-identifications/private', jwtCheck);

app.get('/risk-identifications/:riskId', function(req, res) {
  db.get().query(`SELECT 		  ri.risk_identification_id riskIdentificationId
                              , ri.risk_identification_response riskIdentificationResponse
                              , ri.risk_identification_added_date riskIdentificationAddedDate
                              , u.user_id
			                        , u.user_name userName
                              , p.project_id projectId
                              , p.project_name projectName
                              , a.activity_id activityId
                              , a.activity_title activityTitle
                              , r.risk_id riskId
                              , r.risk_title riskTitle
                  FROM 		    risk_identifications ri
                  INNER JOIN	risks r ON r.risk_id = ri.risk_id
                  INNER JOIN	users u ON u.user_id = ri.user_id
                  LEFT JOIN   projects p ON p.project_id = ri.project_id
                  LEFT JOIN   activities a ON a.activity_id = ri.activity_id
                  WHERE		    ri.risk_id = ?
                  ORDER BY    ri.risk_identification_id DESC;`, [req.params.riskId], function(err, rows, fields) {
    if (err) {
      return res.status(400).send({
        error: "Unable to fetch risk identifications", 
        details: err
      });
    }
    
    res.status(200).send(rows);
  });
});

app.post('/risk-identifications', function(req, res) {  
  riskIdentification = {
    risk_id: req.body.riskId,
    project_id: req.body.projectId,
    activity_id: req.body.activityId,
    user_id: req.body.userId,
    risk_identification_added_date: new Date()
  };

  db.get().query('INSERT INTO risk_identifications SET ?', [riskIdentification], function(err, result){ 
    if (err)
      return res.status(400).send({
        error: "Unable to add risk identification", 
        details: err
      });

    res.status(200).send({
      success: "Risk identification added successfully",
      result
    });
  });
});

app.put('/risk-identifications/:riskIdentificationId', function (req, res) {
  riskIdentification = {
    risk_identification_response: req.body.riskIdentificationResponse
  };

  db.get().query('UPDATE risk_identifications SET ? WHERE risk_identification_id = ?',
    [riskIdentification, req.params.riskIdentificationId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to update risk identification",
          details: err
        });

      res.status(200).send({
        success: "Risk identification updated successfully",
        result
      });
    });
});

app.delete('/risk-identifications/:riskIdentificationId', function(req, res) {  
  db.get().query('DELETE FROM risk_identifications WHERE risk_identification_id = ?', [req.params.riskIdentificationId], function(err, result){ 
    if (err) {
      return res.status(400).send({
        error: "Unable to remove risk identification", 
        details: err
      });
    }

    res.status(200).send({
      success: "Risk identification removed successfully",
      result
    });
  });
});