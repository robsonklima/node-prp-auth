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

app.use('/risk-problems/private', jwtCheck);

app.get('/risk-problems/projects/:userId/:riskId', function(req, res) {
  db.get().query(`SELECT 			p.project_id projectId
                      				, p.project_name projectName
                              , (SELECT risk_identification_id FROM risk_identifications ri
                                  WHERE ri.project_id = p.project_id AND ri.risk_id = ?
                                  LIMIT 1) riskIdentificationId
                              , (SELECT risk_problem_id FROM risk_problems rp
                                  WHERE rp.risk_identification_id =
                                      (SELECT risk_identification_id FROM risk_identifications ri
                                        WHERE ri.project_id = p.project_id AND ri.risk_id = ?
                                        LIMIT 1)
                                  LIMIT 1) riskProblemId
                  FROM 			  projects p
                  INNER JOIN	activities a ON p.project_id = a.project_id
                  WHERE			  a.user_id = ?
                  AND				  (SELECT risk_identification_id FROM risk_identifications ri
                                WHERE ri.project_id = p.project_id AND ri.risk_id = ?
                                LIMIT  1) IS NOT NULL
                  GROUP BY 		p.project_id`, [req.params.riskId, req.params.riskId, 
                  req.params.userId, req.params.riskId], function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});

app.get('/risk-problems/activities/:userId/:riskId', function(req, res) {
  db.get().query(`SELECT 			a.activity_id activityId
                              , a.activity_title activityTitle
                              , (SELECT risk_identification_id FROM risk_identifications ri
                                  WHERE a.activity_id = ri.activity_id AND ri.risk_id = ?
                                  LIMIT 1) riskIdentificationId
                              , (SELECT risk_problem_id FROM risk_problems rp
                                  WHERE rp.risk_identification_id =
                                    (SELECT risk_identification_id FROM risk_identifications ri
                                        WHERE a.activity_id = ri.activity_id AND ri.risk_id = ?
                                        LIMIT 1)
                                LIMIT 1) riskProblemId
                  FROM 			  projects p
                  INNER JOIN	activities a ON p.project_id = a.project_id
                  WHERE			  a.user_id = ?
                  AND				  (SELECT risk_identification_id FROM risk_identifications ri
                                WHERE a.activity_id = ri.activity_id AND ri.risk_id = ?
                                LIMIT 1) IS NOT NULL
                  GROUP BY 		a.activity_id`, [req.params.riskId, req.params.riskId, 
                  req.params.userId, req.params.riskId], function(err, rows, fields) {
    if (err) 
        return res.status(400).send({"error": true, "details": err});            
    
    res.status(200).send(rows);
  });
});

app.post('/risk-problems', function(req, res) { 
  riskProblem = {
    risk_identification_id: req.body.riskIdentificationId,
    user_id: req.body.userId,
    risk_problem_added_date: new Date()
  };

  db.get().query('INSERT INTO risk_problems SET ?', [riskProblem], function(err, result){ 
    if (err)
      return res.status(400).send({
        error: "Unable to add risk problem", 
        details: err
      });

    res.status(200).send({
      success: "Risk problem added successfully",
      result
    });
  });
});

app.put('/risk-problems/:riskProblemId', function (req, res) {
  riskProblem = {
    risk_problem_deal: req.body.riskProblemDeal
  };

  db.get().query('UPDATE risk_problems SET ? WHERE risk_problem_id = ?',
    [riskProblem, req.params.riskProblemId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to update risk problem",
          details: err
        });

      res.status(200).send({
        success: "Risk problem updated successfully",
        result
      });
    });
});

app.delete('/risk-problems/:riskProblemId', function(req, res) {  
  db.get().query('DELETE FROM risk_problems WHERE risk_problem_id = ?', [req.params.riskProblemId], function(err, result){ 
    if (err)
      return res.status(400).send({
        error: "Unable to remove risk problem", 
        details: err
      });

    res.status(200).send({
      success: "Risk problem removed successfully",
      result
    });
  });
});