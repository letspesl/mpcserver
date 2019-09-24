'use strict';

const {createLogger, format} = require('winston'),
    moment = require('moment'),
    util = require('util'),
    _ = require('lodash'),
    DailyRotateFile = require('winston-daily-rotate-file'),
    config = require('config');

const timezone = config.timezone;

let timestamp = function(info) {
    return moment().utcOffset(timezone).format();
};

const myLogFormat = format.printf(({ level, message, label, timestamp }) => {
    if (typeof message === 'string') {
        return `${timestamp} - ${message}`;
    } else if (typeof message === 'object') {
        return `${timestamp} - ${util.inspect(message, {compact : true, depth : 5, breakLength : Infinity})}`;
    }
});

let webLogStream = {
    write: function(message, encoding) {
        webLog.info(message);
    }
};

let webLog = createLogger({
    level : config.webLog.level,
    format: format.combine(
        format.timestamp({format : timestamp}),
        myLogFormat,
    ),
    transports: [
        new DailyRotateFile(config.webLog)
    ]
});

let dbLog = createLogger({
    level : config.dbLog.level,
    format: format.combine(
        format.timestamp({format : timestamp}),
        myLogFormat,
    ),
    transports: [
        new DailyRotateFile(config.dbLog)
    ]
});

let errLog = createLogger({
    level : config.errLog.level,
    format: format.combine(
        format.timestamp({format : timestamp}),
        myLogFormat,
    ),
    transports: [
        new DailyRotateFile(config.errLog)
    ]
});

const Logs =  {
    webLogStream : webLogStream,
    webLog : webLog,
    dbLog : dbLog,
    errLog : errLog,
};

module.exports = exports = Logs;
