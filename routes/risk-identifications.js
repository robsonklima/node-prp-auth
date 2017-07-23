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

app.get('/risk-identifications/projects/:userId/:riskId', function(req, res) {
  db.get().query(`SELECT 			p.project_id projectId
                              , p.project_name projectName
                              , (SELECT  risk_identification_id
                                  FROM   risk_identifications ri
                                  WHERE  ri.project_id = p.project_id
                                  AND    ri.risk_id = ?
                                  LIMIT  1) riskIdentificationId
                  FROM 			  projects p
                  INNER JOIN	activities a ON p.project_id = a.project_id
                  WHERE			  a.user_id = ?
                  GROUP BY 		p.project_id`, [req.params.riskId, req.params.userId], function(err, rows, fields) {
    return res.status(400).send({
      error: "Unable to fetch risk identifications", 
      details: err
    });
    
    res.status(200).send(rows);
  });
});

app.get('/risk-identifications/activities/:userId/:riskId', function(req, res) {
  db.get().query(`SELECT 			a.activity_id activityId
                              , a.activity_title activityTitle
                              , (SELECT  risk_identification_id
                                  FROM   risk_identifications ri
                                  WHERE  ri.activity_id = a.activity_id
                                  AND    ri.risk_id = ?
                                  LIMIT  1) riskIdentificationId
                  FROM 			  projects p
                  INNER JOIN	activities a ON p.project_id = a.project_id
                  WHERE			  a.user_id = ?
                  GROUP BY 		a.activity_id`, [req.params.riskId, req.params.userId], function(err, rows, fields) {
    return res.status(400).send({
      error: "Unable to fetch risk identifications", 
      details: err
    });
    
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