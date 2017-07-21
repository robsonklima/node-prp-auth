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

app.use('/projects', jwtCheck);

app.get('/projects', function (req, res) {
  db.get().query(`SELECT 	    p.project_id projectId
                              , p.project_name projectName
                              , p.project_scope projectScope
                              , p.project_added_date projectAddedDate
                              , count(a.activity_id) projectAmountActivities
                   FROM 		  projects p
                   LEFT JOIN	activities a on p.project_id = a.project_id
                   GROUP BY 	p.project_id
                   ORDER BY 	p.project_name`, function (err, rows, fields) {
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

      res.status(200).send(rows);
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
        project
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