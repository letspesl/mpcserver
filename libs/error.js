'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    util = require('util'),
    log = require('libs/log');

const errLog = log.errLog;

const errors = {
    BAD_REQUEST : {error_code : 400, error_msg : 'Incorrect parameter'},
    UNAUTHORIZED : {error_code : 401, error_msg : 'Authentication failed. Please sign in again'},
    NOT_FOUND : {error_code : 404, error_msg : 'Not Found'},
    NOT_ACCEPTABLE : {error_code : 406, error_msg : 'Not Acceptable'},
    INTERNAL_SERVER_ERROR : {error_code : 500, error_msg : 'Internal Server Error'},
    INVALID_ORIGIN_ACCESS_TOKEN: {error_code : 304, error_msg : 'This origin access token is invalid'},
    MAINTENANCE_ERROR : {error_code : 1000, error_msg : 'This server is currently under maintenance.'},
    DUPLICATE_ERROR : {error_code : 1002, error_msg : 'Duplicate'},
};

const sendRes = function(res, err, extra) {
    let errorKey = err;
    if (typeof err === 'object') {
        errorKey = err.errorKey;
        err.extra = err.extra || extra;
        errLog.info(util.inspect(err, {compact : true, depth : 5, breakLength : Infinity}));
    } else if (typeof err === 'string') {
        let error = create(err, extra);
        errLog.info(util.inspect(error, {compact : true, depth : 5, breakLength : Infinity}));
    }
    let errorRes = createRes(errorKey, null);
    res.json(errorRes);
};

const createRes = function(errorKey, extra) {
    let error = Object.assign({}, errors[errorKey]);
    if (_.isEmpty(error)) {
        error = Object.assign({}, errors['INTERNAL_SERVER_ERROR']);
    }
    if (!_.isNil(extra)) {
        error.extra = extra;
    }
    return {error : error};
};

const create = function(errorKey, extra) {
    let err = new Promise.OperationalError(),
        errorObj = errors[errorKey];

    if (!_.isEmpty(errorObj)) {
        err.code = errorObj.error_code;
        err.message = errorObj.error_msg;
    }
    err.errorKey = errorKey;
    if (!_.isNil(extra)) {
        err.extra = extra;
    }
    return err;
};

module.exports = exports = {sendRes, createRes, create, errors};
