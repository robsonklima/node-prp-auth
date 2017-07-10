var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors'); //add cors

var users = require('./routes/users');
var projects = require('./routes/projects');
var activities = require('./routes/activities');
var riskTypes = require('./routes/risk-types');
var riskCategories = require('./routes/risk-categories');
var riskIdentifications = require('./routes/risk-identifications');
var riskProblems = require('./routes/risk-problems');
var risks = require('./routes/risks');
var riskReviews = require('./routes/risk-reviews');
var riskReviewReferences = require('./routes/risk-review-references');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(users);
app.use(projects);
app.use(activities);
app.use(riskTypes);
app.use(riskCategories);
app.use(riskIdentifications);
app.use(risks);
app.use(riskProblems);
app.use(riskReviews);
app.use(riskReviewReferences);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;