var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongostore')(session);

var cors = require('cors');
var corsOptions = {
  origin: 'http://192.168.1.134:8100'
};

var home = require('./app/routes/home');
var users = require('./app/routes/users');
var auth = require('./app/routes/auth');

var mongoose   = require('mongoose');
mongoose.connect(process.env.MONGO_URI); // connect to our database

var app = express();

var hour = 3600000;
var day = (hour * 24);

app.use(session({
  secret: 'keyboard cat',
  cookie: { maxAge: 7 * day },
  store: new MongoStore({ db: 'sessions' })
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());


var corsSettings = {
  credentials: true,
  methods: ['GET', 'PUT',' POST', 'OPTIONS'],
  origin: function(origin, callback) {
    if (!origin) return callback(null, false);
     if ( origin.indexOf('127.0.0.1') || origin.indexOf('localhost') ){
       callback(null, true);
     } else {
       callback(true, false);
     }
  }
};

app.use(cors(corsSettings));


app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Routing
app.use('/', home);
app.use('/users', users);
app.use('/auth', auth);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

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
