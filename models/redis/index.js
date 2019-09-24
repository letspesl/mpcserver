'use strict';

const _ = require('lodash'),
    SEnum = require('libs/enum'),
    RedisClient = require('./redis_client'),
    config = require('config').redis;

RedisClient.key = function(type, keyIds, version) {
    let keyStr = _key(type, keyIds);
    if (!_.isNil(version)) {
        keyStr = `${keyStr}:v:${version}`;
    }
    return keyStr;
};

RedisClient.expire = function(type) {
    var expireTime = config.expire.default;
    switch (type) {
        // auth
        case SEnum.REDIS_TYPE_USER_SESSION:
            expireTime = config.expire.redis_user_session;
            break;
        case SEnum.REDIS_TYPE_X_LOCK:
            expireTime = config.expire.redis_mongo_x_lock;
            break;
        case SEnum.REDIS_TYPE_REVIEW:
            expireTime = config.expire.redis_review;
            break;
    }
    return expireTime || config.expire.default;
};

function _key(type, keyIds) {
    switch (type) {
        case SEnum.REDIS_TYPE_ADMIN_SESSION:
            return 'nb:sess:admins:' + keyIds[0];   // admin id
        case SEnum.REDIS_TYPE_USER_SESSION:
            return 'nb:sess:users:' + keyIds[0];    // user id
        case SEnum.REDIS_TYPE_DAPP_SESSION:
            return 'nb:sess:dapps:' + keyIds[0];    // dapp id
        case SEnum.REDIS_TYPE_BATCH_STATUS:
            return `nb:batch:status:${keyIds[0]}`;  // job name
        case SEnum.REDIS_TYPE_BATCH_CMD:
            return `nb:batch:cmd:${keyIds[0]}`;     // job name
        case SEnum.REDIS_TYPE_BATCH_CMD_ALL:
            return 'nb:batch:cmd:all';
        case SEnum.REDIS_TYPE_MAINTENANCE:
            return 'nb:maintenance';                // maintenance  'START' or 'STOP'
        case SEnum.REDIS_TYPE_FRONTEND_MANIFEST:    // front-end
            return 'nb:frontend:manifest';
        case SEnum.REDIS_TYPE_X_LOCK:
            return `nb:mongo:xlock:${keyIds[0]}`;   // composit key ex) collName_fieldName_keyName
        case SEnum.REDIS_TYPE_REVIEW:
            return `nb:review:dapps:${keyIds[0]}`;
    }
    return 'none';
}

module.exports = RedisClient;
