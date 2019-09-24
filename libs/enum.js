'use strict';

module.exports = {
    AUTH_TYPE_KEY : 0,
    AUTH_TYPE_SIG : 1,

    USER_TYPE_NORMAL : 0,    // normal user
    USER_TYPE_ADMIN : 1,     // admin user
    
    // Redis Type
    REDIS_TYPE_ADMIN_SESSION : 1,  // admin session
    REDIS_TYPE_USER_SESSION : 2,   // user session
    REDIS_TYPE_X_LOCK : 3,
    REDIS_TYPE_BATCH_STATUS : 11,
    REDIS_TYPE_BATCH_CMD : 12,
    REDIS_TYPE_BATCH_CMD_ALL : 13,
    REDIS_TYPE_MAINTENANCE : 14,
    REDIS_TYPE_REVIEW : 15,        // 스토어 심사를 받을때 사용함.

    REDIS_TYPE_FRONTEND_MANIFEST : 21,
};
