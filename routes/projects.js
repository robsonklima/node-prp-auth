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

// app.use('/projects', jwtCheck);

app.get('/projects', function (req, res) {
  db.get().query(`SELECT 	    p.project_id projectId
                              , p.project_name projectName
                              , p.project_scope projectScope
                              , p.project_added_date projectAddedDate
                              , (SELECT count(*)
                                  FROM 	activities a
                                  WHERE p.project_id = a.project_id) projectAmountActivities
                              , (SELECT count(*)
                                  FROM 	risk_identifications ri
                                  WHERE p.project_id = ri.project_id) projectAmountRiskIdentifications
                              , (SELECT count(*)
                                  FROM 	risk_problems rp
                                  WHERE 	rp.risk_identification_id IN (
                                    SELECT risk_identification_id 
                                    FROM risk_identifications 
                                    WHERE project_id = p.project_id)) projectAmountProblems
                              , SUM(a.activity_amount_hours) projectAmountHours
                              , (SELECT 			ROUND(SUM(r.role_hour_charge * a.activity_amount_hours), 2)
                                  FROM 			  projects p_aux
                                  LEFT JOIN 	activities a ON p_aux.project_id = a.project_id
                                  LEFT JOIN	  users u ON u.user_id = a.user_id
                                  LEFT JOIN	  roles r ON u.role_id = r.role_id
                                  WHERE 			p_aux.project_id = p.project_id
                                  GROUP BY 		p_aux.project_id ) projectValue
                    FROM 		    projects p
                    LEFT JOIN	  risk_identifications ri ON p.project_id = ri.project_id
                    LEFT JOIN	  activities a ON p.project_id = a.project_id
                    LEFT JOIN	  users u ON u.user_id = a.user_id
                    LEFT JOIN	  roles r ON u.role_id = r.role_id
                    GROUP BY 	  p.project_id
                    ORDER BY 	  p.project_name;`, function (err, rows, fields) {
      if (err)
        return res.status(400).send({ 
          error: "Unable to fetch projects", 
          details: err 
      });

      res.status(200).send(rows);
    });
});

app.get('/projects/:projectId', function (req, res) {
  db.get().query(`SELECT      project_id projectId
                              , project_name projectName
                              , project_scope projectScope
                              , project_added_date projectAddedDate
                   FROM       projects 
                   WHERE      project_id = ?`,
    [req.params.projectId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({ 
          error: "Unable to fetch project", 
          details: err 
        });

      res.status(200).send(rows[0]);
    });
});

app.get('/projects/reviewed-risks/:projectId', function (req, res) {
  db.get().query(`SELECT 	riskId
                          , riskTitle
                          , riskTypeName
                          , riskCategoryName
                          , riskReviewCost
                          , riskReviewSchedule
                          , riskReviewScope
                          , riskReviewQuality
                          , riskReviewProbability
                          , consolidatedImpact
                          , qualificationDegree
                          , riskReviewAmount
                          , projectValue
                          , CASE 
                              WHEN (consolidatedImpact) <= 30  
                              THEN 'Low'    
                              WHEN (consolidatedImpact) > 30 AND (consolidatedImpact) <= 70
                              THEN 'Medium'
                              WHEN (consolidatedImpact) > 70 
                              THEN 'High'
                            END riskReviewPriority
                          , ROUND((riskReviewProbability/100) * 
                            (projectValue * (riskReviewCost/100)), 2) expectedValue
                          , ROUND((projectValue * riskReviewCost)/100, 2) impactValue
                      FROM
                      (
                        SELECT      r.risk_id riskId
                                    , r.risk_title riskTitle
                                    , rt.risk_type_name riskTypeName
                                    , rc.risk_category_name riskCategoryName
                                    , AVG(rr.risk_review_cost) riskReviewCost
                                    , AVG(rr.risk_review_schedule) riskReviewSchedule
                                    , AVG(rr.risk_review_scope) riskReviewScope
                                    , AVG(rr.risk_review_quality) riskReviewQuality
                                    , AVG(rr.risk_review_probability) riskReviewProbability
                                    , GREATEST(AVG(rr.risk_review_cost), AVG(rr.risk_review_schedule)
                                      , AVG(rr.risk_review_scope), AVG(rr.risk_review_quality)) consolidatedImpact
                                    , GREATEST(AVG(rr.risk_review_cost), AVG(rr.risk_review_schedule)
                                      , AVG(rr.risk_review_scope), AVG(rr.risk_review_quality)) * 
                                      AVG(rr.risk_review_probability) as qualificationDegree
                                    , COUNT(ri.risk_identification_id) riskReviewAmount
                                    , (SELECT 		SUM(r.role_hour_charge * a.activity_amount_hours) baseValue
                                        FROM 		  projects p
                                        LEFT JOIN activities a ON p.project_id = a.project_id
                                        LEFT JOIN	users u ON u.user_id = a.user_id
                                        LEFT JOIN	roles r ON u.role_id = r.role_id
                                        WHERE 		p.project_id = ?
                                        GROUP BY 	p.project_id) projectValue
                        FROM 			  risk_reviews rr
                        INNER JOIN	risk_identifications ri ON ri.risk_identification_id = rr.risk_identification_id
                        INNER JOIN	projects p ON ri.project_id = p.project_id
                        INNER JOIN	risks r ON r.risk_id = ri.risk_id
                        INNER JOIN	risk_types rt ON r.risk_type_id = rt.risk_type_id
                        INNER JOIN	risk_categories rc ON r.risk_category_id = rc.risk_category_id
                        WHERE 			ri.project_id = ?
                        GROUP BY		r.risk_id
                      ) data;`,[req.params.projectId, req.params.projectId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({ 
          error: "Unable to fetch risks of this project", 
          details: err 
        });

      res.status(200).send(rows);
    });
});

app.get('/projects/expected-values/:projectId', function (req, res) {
  db.get().query(`SELECT 	
                        (SUM(projectValue)/SUM(amountRisks)) 
                          - SUM(opportunityImpactValue) bestCase
                        , SUM(projectValue)/SUM(amountRisks) baseValue
                        , (SUM(projectValue)/SUM(amountRisks)) 
                          + SUM(threatExpectedValue) - SUM(opportunityExpectedValue) expectedValue
                        , (SUM(projectValue)/SUM(amountRisks)) 
                          + SUM(threatImpactValue) worstCase
                    FROM 
                    (
                      SELECT 			
                            riskTypeName
                            , amountReviews
                            , amountRisks
                            , projectValue
                            , (projectValue * riskReviewCost) as projectImpact
                            , CASE WHEN riskTypeName = 'Threat' THEN ((riskReviewProbability / 100) 
                              * (projectValue * (riskReviewCost / 100))) ELSE 0 END as threatExpectedValue
                            , CASE WHEN riskTypeName = 'Threat' THEN (projectValue * (riskReviewCost / 100)) ELSE 0 END as threatImpactValue
                            , CASE WHEN riskTypeName = 'Opportunity' THEN ((riskReviewProbability / 100) 
                              * (projectValue * (riskReviewCost / 100))) ELSE 0 END as opportunityExpectedValue
                            , CASE WHEN riskTypeName = 'Opportunity' THEN (projectValue * (riskReviewCost / 100)) ELSE 0 END as opportunityImpactValue
                      FROM
                      (
                        SELECT 
                                    rt.risk_type_name riskTypeName
                                    , AVG(rr.risk_review_cost) riskReviewCost
                                    , AVG(rr.risk_review_probability) riskReviewProbability
                                    , COUNT(distinct rr.risk_review_id) as amountReviews
                                    , COUNT(distinct r.risk_id) as amountRisks
                                    , (SELECT 			ROUND(SUM(r.role_hour_charge * a.activity_amount_hours), 2) as baseValue
                                        FROM 			  projects p
                                        LEFT JOIN 	activities a on p.project_id = a.project_id
                                        LEFT JOIN	  users u ON u.user_id = a.user_id
                                        LEFT JOIN	  roles r ON u.role_id = r.role_id
                                        WHERE 			p.project_id = ?
                                        GROUP BY 		p.project_id ) as projectValue
                        FROM 		    risk_reviews rr
                        INNER JOIN	risk_identifications ri on rr.risk_identification_id = ri.risk_identification_id
                        INNER JOIN	risks r on ri.risk_id = r.risk_id
                        INNER JOIN	risk_types rt on r.risk_type_id = rt.risk_type_id
                        INNER join	risk_categories rc on rc.risk_category_id = r.risk_category_id
                        LEFT JOIN	  projects p on p.project_id = ri.project_id
                        WHERE 		  ri.project_id = ?
                        GROUP BY	  ri.risk_identification_id
                      ) as data1
                    ) as data2;`, [req.params.projectId, req.params.projectId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({ 
          error: "Unable to fetch project", 
          details: err 
        });

      res.status(200).send(rows[0]);
    });
});

app.post('/projects', function (req, res) {
  project = {
    project_name: req.body.projectName,
    project_scope: req.body.projectScope,
    project_added_date: new Date()
  };

  db.get().query('INSERT INTO projects SET ?',
    [project], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to add project", details: err
        });

      res.status(200).send({
        success: "Project added successfully",
        project
      });
    });
});

app.put('/projects/:projectId', function (req, res) {
  project = {
    project_name: req.body.projectName,
    project_scope: req.body.projectScope
  };

  db.get().query('UPDATE projects SET ? WHERE project_id = ?',
    [project, req.params.projectId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to update project",
          details: err
        });

      res.status(200).send({
        success: "Project updated successfully",
        result
      });
    });
});

app.delete('/projects/:projectId', function (req, res) {
  db.get().query('DELETE FROM projects WHERE project_id = ?',
    [req.params.projectId], function (err, result) {
      if (err)
        return res.status(400).send({
          error: "Unable to remove project",
          details: err
        });

      res.status(200).send({
        success: "Project removed successfully"
      });
    });
});