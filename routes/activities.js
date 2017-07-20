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
                   AND    a.project_id = ?
                   ORDER BY a.activity_title`, [req.params.projectId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({
          error: "Unable to fetch activity",
          details: err
        });

      res.status(200).send(rows);
    });
});

app.get('/activities/:activityId', function (req, res) {
  db.get().query(`SELECT 
                    activity_id activityId
                    , activity_title activityTitle
                    , activity_details activityDetails
                    , activity_amount_hours activityAmountHours
                    , activity_added_date activityAddedDate
                    , project_id projectId
                    , user_id userId
                   FROM activities WHERE activity_id = ?`,
    [req.params.activityId], function (err, rows, fields) {
      if (err)
        return res.status(400).send({
          error: "Unable to fetch activity",
          details: err
        });

      res.status(200).send(rows);
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