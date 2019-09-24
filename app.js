'use strict';

const express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    config = require('config'),
    log = require('libs/log'),
    routeApi = require('routes/api');

const errLog = log.errLog;
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// nginx를 사용하는 경우, 실제 clientIP를 얻기 위해서
app.enable('trust proxy');

app.use(logger(':remote-addr - ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - ":response-time ms"', {stream : log.webLogStream}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));
app.use(cookieParser());

app.use(cors({
    origin : config.cors.whitelist,
    methods : ['GET', 'POST', 'DELETE', 'PUT'],
    credentials : true,
}));

app.all('/api/1/echo', function(req, res, next) {
    res.json('echo');
});

routeApi.useRoutes(app);

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    res.status(500).json({error : 'NOT_FOUND'});
});

app.use(function errorHandler(err, req, res, next) {
    errLog.info(err);
    errLog.info(err.stack);
    res.status(500).json({error : 'INTERNAL_SERVER_ERROR'});
});

process.on('uncaughtException', function(err) {
    errLog.info('uncaughtException : ' + err);
    errLog.info(err.stack);
});

module.exports = app;
