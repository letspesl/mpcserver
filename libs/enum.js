'use strict';

module.exports = {
    AUTH_TYPE_KEY : 0,
    AUTH_TYPE_SIG : 1,

    USER_TYPE_NORMAL : 0,    // normal user
    USER_TYPE_ADMIN : 1,     // admin user
    
    PROTOCOL_TYPE_GENERATE_KEY : 0,
    PROTOCOL_TYPE_BACKUP_KEY : 1,
    PROTOCOL_TYPE_RECOVERY_KEY : 2,
    PROTOCOL_TYPE_GENERATE_SIG : 3,

    // Redis Type
    REDIS_TYPE_ADMIN_SESSION : 1,  // admin session
    REDIS_TYPE_USER_SESSION : 2,   // user session
    REDIS_TYPE_X_LOCK : 3,
    REDIS_TYPE_BATCH_STATUS : 11,
    REDIS_TYPE_BATCH_CMD : 12,
    REDIS_TYPE_BATCH_CMD_ALL : 13,
    REDIS_TYPE_MAINTENANCE : 14,

    REDIS_TYPE_FRONTEND_MANIFEST : 21,
};
