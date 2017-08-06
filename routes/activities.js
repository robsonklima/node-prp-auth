var express = require('express'),
  _ = require('lodash'),
  config = require('../config'),
  jwt = require('jsonwebtoken'),
  ejwt = require('express-jwt'),
  db = require('../db');

var app = module.exports = express.Router();

var jwtCheck = ejwt({
  secret: config.secretKey
});

app.use('/activities/private', jwtCheck);

app.get('/activities', function (req, res) {
  db.get().query(`SELECT 	  
                   a.activity_id activityId
                   , a.activity_title activityTitle
                   , a.activity_details activityDetails
                   , a.activity_amount_hours activityAmountHours
                   , a.activity_added_date activityAddedDate
                   , a.project_id projectId
                   , a.user_id userId
                   , p.project_name projectName
                   , u.user_name userName
                   FROM 	activities a, projects p, users u
                   WHERE 	a.project_id = p.project_id and a.user_id = u.user_id
                   ORDER BY a.activity_title`, function (err, rows, fields) {
      if (err)
        return res.status(400).send({
          error: "Unable to fetch activity",
          details: err
        });

      res.status(200).send(rows);
    });
});

app.get('/activities/project/:projectId', function (req, res) {
  db.get().query(`SELECT 	    a.activity_id activityId
                              , a.activity_title activityTitle
                              , a.activity_details activityDetails
                              , a.activity_amount_hours activityAmountHours
                              , a.activity_added_date activityAddedDate
                              , a.project_id projectId
                              , a.user_id userId
                              , p.project_name projectName
                              , u.user_name userName
                              , (SELECT  count(*) 
                                FROM   risk_identifications ri
                                WHERE  a.activity_id = ri.activity_id) activityAmountRiskIdentifications
                              , (SELECT  count(*) 
                                FROM   risk_problems rp 
                                WHERE  rp.risk_identification_id IN (
                                  SELECT risk_identification_id 
                                  FROM   risk_identifications 
                                  WHERE  activity_id = a.activity_id)) activityAmountProblems
                   FROM 	    activities a, projects p, users u
                   WHERE 	    a.project_id = p.project_id and a.user_id = u.user_id
                   AND        a.project_id = ?
                   ORDER BY   a.activity_title;`, 
                   [req.params.projectId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({
          error: "Unable to fetch activities",
          details: err
        });

      res.status(200).send(rows);
    });
});

app.get('/activities/:activityId', function (req, res) {
  db.get().query(`SELECT        a.activity_id activityId
                                , a.activity_title activityTitle
                                , a.activity_details activityDetails
                                , a.activity_amount_hours activityAmountHours
                                , a.activity_added_date activityAddedDate
                                , a.project_id projectId
                                , a.user_id userId
                                , u.user_name userName
                   FROM         activities a
                   INNER JOIN   users u ON a.user_id = u.user_id
                   WHERE        activity_id = ?;`,
    [req.params.activityId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({
          error: "Unable to fetch activity",
          details: err
        });

      res.status(200).send(rows);
    });
});

app.get('/activities/expected-values/:activityId', function (req, res) {
  db.get().query(`SELECT (SUM(activityValue)/SUM(amountRisks)) - SUM(opportunityImpactValue) bestCase
                         , (SUM(activityValue)/SUM(amountRisks)) baseValue
                         , (SUM(activityValue)/SUM(amountRisks)) + SUM(threatExpectedValue) - SUM(opportunityExpectedValue) expectedValue
                         , (SUM(activityValue)/SUM(amountRisks)) + SUM(threatImpactValue) worstCase
                    FROM 
                    (
                      SELECT 			
                        riskTypeName
                        , amountReviews
                        , amountRisks
                        , activityValue
                        , (activityValue * riskReviewCost) as activityImpact
                        , CASE WHEN riskTypeName = 'Threat' THEN ((riskReviewProbability / 100) 
                          * (activityValue * (riskReviewCost / 100))) ELSE 0 END as threatExpectedValue
                        , CASE WHEN riskTypeName = 'Threat' THEN (activityValue * (riskReviewCost / 100)) ELSE 0 END as threatImpactValue
                        , CASE WHEN riskTypeName = 'Opportunity' THEN ((riskReviewProbability / 100) 
                          * (activityValue * (riskReviewCost / 100))) ELSE 0 END as opportunityExpectedValue
                        , CASE WHEN riskTypeName = 'Opportunity' THEN (activityValue * (riskReviewCost / 100)) ELSE 0 END as opportunityImpactValue
                      FROM
                      (
                        SELECT 
                                    rt.risk_type_name riskTypeName
                                    , AVG(rr.risk_review_cost) riskReviewCost
                                    , AVG(rr.risk_review_probability) riskReviewProbability
                                    , COUNT(DISTINCT rr.risk_review_id) as amountReviews
                                    , COUNT(DISTINCT r.risk_id) as amountRisks
                                    , (SELECT 		ROUND(SUM(r.role_hour_charge * a.activity_amount_hours), 2) as baseValue
                                        FROM 			  activities a
                                        LEFT JOIN	  users u ON u.user_id = a.user_id
                                        LEFT JOIN	  roles r ON u.role_id = r.role_id
                                        WHERE 			a.activity_id = ?
                                        GROUP BY 		a.activity_id) as activityValue
                        FROM 		    risk_reviews rr
                        INNER JOIN	risk_identifications ri on rr.risk_identification_id = ri.risk_identification_id
                        INNER JOIN	risks r on ri.risk_id = r.risk_id
                        INNER JOIN	risk_types rt on r.risk_type_id = rt.risk_type_id
                        INNER join	risk_categories rc on rc.risk_category_id = r.risk_category_id
                        WHERE 		  ri.activity_id = ?
                        GROUP BY	  ri.risk_identification_id
                      ) as data1
                    ) as data2`, 
                    [req.params.activityId, req.params.activityId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({ 
          error: "Unable to fetch project", 
          details: err 
        });

      res.status(200).send(rows[0]);
    });
});

app.post('/activities', function (req, res) {
  activity = {
    activity_title: req.body.activityTitle,
    activity_details: req.body.activityDetails,
    activity_amount_hours: req.body.activityAmountHours,
    project_id: req.body.projectId,
    user_id: req.body.userId,
    activity_added_date: new Date()
  };

  db.get().query('INSERT INTO activities SET ?', [activity], function (err, result) {
    if (err)
      return res.status(400).send({
          error: "Unable to add activity",
          details: err
        });

    res.status(200).send({
      success: "Activity added successfully",
      activity
    });
  });
});

app.put('/activities/:activityId', function (req, res) {
  activity = {
    activity_title: req.body.activityTitle,
    activity_details: req.body.activityDetails,
    activity_amount_hours: req.body.activityAmountHours,
    project_id: req.body.projectId,
    user_id: req.body.userId,
    activity_added_date: new Date()
  };

  db.get().query('UPDATE activities SET ? WHERE activity_id = ?',
    [activity, req.params.activityId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to update activity",
          details: err
        });

      res.status(200).send({
        success: "Activity udpated successfully",
        activity
      });
    });
});

app.delete('/activities/:activityId', function (req, res) {
  db.get().query('DELETE FROM activities WHERE activity_id = ?',
    [req.params.activityId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to remove activity",
          details: err
        });

      res.status(200).send({
        success: "Activity removed successfully"
      });
    });
});