var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var methodOverride = require('method-override');
var passport = require('passport');
//var oauth2 = require('./middleware/oauth2');
//var requiredAuthentication = require('./middleware').requiredAuthentication;
//var checkClientId = require('./middleware').checkClientId;

var clientInfo = require('./middleware').clientInfo;
var userInfo = require('./middleware').userInfo;

var index = require('./routes');
var resources = require('./routes/resources');
var clients = require('./routes/clients');
var permissions = require('./routes/permissions');
var servers = require('./routes/servers');
var tokens = require('./routes/tokens');
var tickets = require('./routes/tickets');
//var api = require('./routes/api');



var app = express();
//var server = http.createServer(app);
// view engine setup
//var app = express.createServer();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
//app.use(express.session({ secret: 'keyboard cat' }));
//session
app.use(session({
    name: 'muni',
    secret: 'gemalto',
    saveUninitialized: true,
    resave: true,
    secureProxy: false, // Set to true if you have an SSL Certificate
    cookie: {
        secure: false, // Secure is Recommeneded, However it requires an HTTPS enabled website (SSL Certificate)
        maxAge: 864000000 // 10 Days in miliseconds
    }
}));
app.use(passport.initialize());
app.use(passport.session());
//app.use(app.router);
app.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.error = err;
    if (msg) res.locals.message = msg;
    res.locals.user = req.session.user;
    next();
});

require('./middleware/auth');
index(app);
resources(app);
clients(app);
permissions(app);
servers(app);
tokens(app);
tickets(app);
//api(app);

app.get('/api/userinfo',userInfo);
app.get('/api/clientinfo',clientInfo);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;