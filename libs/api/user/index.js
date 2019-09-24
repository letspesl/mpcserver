'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    moment = require('moment'),
    RedisClient = require('models/redis'),
    mongo = require('models/mongo'),
    SEnum = require('libs/enum'),
    SUtil = require('libs/util'),
    SErr = require('libs/error'),
    Auth = require('./auth');

const User = mongo.User;
const Dapp = mongo.Dapp;
const RecoveryVerif = mongo.RecoveryVerif;
const RecoveryKey = mongo.RecoveryKey;

async function signin(authReq, appVersion, dappId) {
    let dapp = null;
    if (!_.isNil(dappId)) {
        dapp = await Dapp.validate(dappId, authReq);
        if (_.isEmpty(dapp)) {
            throw SErr.create('INVALID_ORIGIN_ACCESS_TOKEN', {authReq, appVersion, dappId, reason : 'invalid dapp info'});
        }
    } else {
        dapp = await Dapp.findOne({shortname : 'NBLKS'});
        dappId = dapp._id;
    }

    let user = await Auth.signIn(authReq);
    if (_.isEmpty(user)) {
        throw SErr.create('INVALID_ORIGIN_ACCESS_TOKEN', {authReq});
    }
    // 애플 심사시에만 bs값을 'y'로 변경해 놓음.
    const review = await SUtil.getReview(dappId);
    if (!_.isNil(review) && review.version === appVersion) {
        user.bs = 'y';
    }

    let accessToken = await createSession(user);
    let recoveryVerif = await RecoveryVerif.findOne({_id : user._id});
    if (!_.isEmpty(recoveryVerif) && (recoveryVerif.phone === 'y' || recoveryVerif.email === 'y')) {  // recovery중에는 recovery객체를 추가함.
        user.recovery = recoveryVerif;
    }
    let recoveryKey = await RecoveryKey.findOne({_id : user._id});
    if (!_.isEmpty(recoveryKey)) {
        recoveryKey = recoveryKey.toObject();
        user.backup_timestamp = recoveryKey.updated_at;
    }

    return {user, accessToken, dapp};
}

async function signout(userId) {
    const sessionToCache = new RedisClient(SEnum.REDIS_TYPE_USER_SESSION, [userId]);
    return sessionToCache.removeAsync();
}

async function get(userId) {
    const user = await User.getUser({_id : userId});
    let recovery = await RecoveryVerif.findOne({_id : user._id});
    if (!_.isEmpty(recovery) && (recovery.phone === 'y' || recovery.email === 'y')) {  // recovery중에는 recovery객체를 추가함.
        user.recovery = recovery;
    }
    let recoveryKey = await RecoveryKey.findOne({_id : user._id});
    if (!_.isEmpty(recoveryKey)) {
        recoveryKey = recoveryKey.toObject();
        user.backup_timestamp = recoveryKey.updated_at;
    }
    return user;
}

async function updateDevice(userId, device) {
    return User.updateOne({_id : userId}, {$set : {device : device}});
}

async function createSession(user) {
    let sessionToCache = new RedisClient(SEnum.REDIS_TYPE_USER_SESSION, [user._id]),
        salt = moment().format();
    let sessionObj = await sessionToCache.restoreAsync()
        .then((sessionJson) => {
            if (_.isEmpty(sessionJson)) {
                throw Error('NOT_EXIST');
            }
            return JSON.parse(sessionJson);
        })
        .catch((err) => {
            let _sessionObj = {
                id : user._id,
                accessToken : SUtil.createAccessToken(user._id, salt),
                salt : salt,
                authType : user.auth_type
            };
            sessionToCache.value = JSON.stringify(_sessionObj);
            return sessionToCache.saveAsync()
                .then(() => {
                    return _sessionObj;
                });
        });
    return sessionObj.accessToken;
}

async function checkAuthorize(req) {
    const user = await getUserFromHeaders(req);
    if (_.isEmpty(user)) {
        return null;
    }
    const cachedSession = new RedisClient(SEnum.REDIS_TYPE_USER_SESSION, [user._id]);
    const sessionJson = await cachedSession.restoreAsync();
    if (_.isEmpty(sessionJson)) {
        return null;
    }
    const sessionInfo = JSON.parse(sessionJson);
    if (sessionInfo.accessToken === user.accessToken) {
        return user;
    } else {
        return null;
    }
}

function checkAuthorizeRes(req, res, next) {
    checkAuthorize(req)
        .then(function(user) {
            if (!_.isEmpty(user)) {
                req.user = user;
                next();
                return null;
            }
            SErr.sendRes(res, 'UNAUTHORIZED', {headers : req.headers});
        })
        .catch(function(err) {
            SErr.sendRes(res, 'UNAUTHORIZED', {headers : req.headers, err});
        });
}

let getUserFromHeaders = function(req) {
    let _id = req.headers.id,
        accessToken = req.headers.accesstoken;

    if (_.isEmpty(_id) || _.isEmpty(accessToken)) {
        return null;
    }
    return {_id, accessToken};
};

module.exports = exports = {signin, signout, get, updateDevice, createSession, checkAuthorizeRes};
