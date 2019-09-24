'use strict';

const mongoose = require('mongoose'),
    _ = require('lodash'),
    config = require('config'),
    Log = require('libs/log');

mongoose.Promise = require('bluebird');

const mongoConfig = config.mongo;
const dbLog = Log.dbLog;

mongoose.set('debug', function(coll, method, query, doc, options) {
    dbLog.info({dbQuery : {coll, method, query, doc, options}});
});

mongoose.set('useFindAndModify', false);

function makeConnection(dbConfig) {
    var opts = null,
        uri = '';
    if (!_.isEmpty(dbConfig.rsName)) {
        opts = {
            autoReconnect : true,
            poolSize: 30,
            rs_name : dbConfig.rsName,
        };

        uri = makeReplSetUri(dbConfig);
    } else {
        opts = {
            autoReconnect : true,
            poolSize: 30,
            useNewUrlParser: true,
            useCreateIndex:true
        };
        uri = makeUri(dbConfig);
    }
    return mongoose.createConnection(uri, opts);
}

//'mongodb://user:pass@localhost:port,anotherhost:port,yetanother:port/database
function makeReplSetUri(dbConfig) {
    var arrUri = [],
        uri = null;

    uri = `mongodb://${dbConfig.account}:${dbConfig.passwd}@`;
    _.forEach(dbConfig.hosts, (host) => arrUri.push(host));
    uri += arrUri.join(',');
    uri = `${uri}\${dbConfig.dbName}`;
    return uri;
}

//'mongodb://user:pass@localhost:port/database
function makeUri(dbConfig) {
    return `mongodb://${dbConfig.account}:${dbConfig.passwd}@${dbConfig.host}/${dbConfig.dbName}`;
}

function createModel(constructor, conn) {
    //return constructor(mongoose, makeConnection(mongoConfig));
    return constructor(mongoose, conn);
}

const conn = makeConnection(mongoConfig);

module.exports = exports = {
    User : createModel(require('models/mongo/user'), conn),
    UserMig : createModel(require('models/mongo/user_mig'), conn),
    Balance : createModel(require('models/mongo/balance'), conn),

    ChainAccount : createModel(require('models/mongo/chain_account'), conn),
    ChainTokenBatch : createModel(require('models/mongo/chain_token_batch'), conn),
    ChainTokenPrice : createModel(require('models/mongo/chain_token_price'), conn),
    ChainPushBatch : createModel(require('models/mongo/chain_push_batch'), conn),
    ChainPushBatchPending : createModel(require('models/mongo/chain_push_batch_pending'), conn),
    ChainTransaction : createModel(require('models/mongo/chain_transaction'), conn),
    ChainTransfer : createModel(require('models/mongo/chain_transfer'), conn),

    OffChainTransaction : createModel(require('models/mongo/offchain_transaction'), conn),
    OffChainTransfer : createModel(require('models/mongo/offchain_transfer'), conn),

    ExchangeRate : createModel(require('models/mongo/exchange_rate'), conn),

    EmailVerif : createModel(require('models/mongo/email_verif'), conn),
    RecoveryVerif : createModel(require('models/mongo/recovery_verif'), conn),
    RecoveryKey : createModel(require('models/mongo/recovery_key'), conn),

    Item : createModel(require('models/mongo/item'), conn),
    Dapp : createModel(require('models/mongo/dapp'), conn),
    TokenPrice : createModel(require('models/mongo/token_price'), conn),
    Product : createModel(require('models/mongo/product'), conn),
    Purchase : createModel(require('models/mongo/purchase'), conn),
    PurchaseItem : createModel(require('models/mongo/purchase_item'), conn),

    LeaderBoard : createModel(require('models/mongo/leader_board'), conn),
    LeaderBoardBatch : createModel(require('models/mongo/leader_board_batch'), conn),

    Action : createModel(require('models/mongo/action'), conn),


    Summary : createModel(require('models/mongo/summary'), conn),
    Admin : createModel(require('models/mongo/admin'), conn),
    FrontEnd : createModel(require('models/mongo/front_end'), conn),
    Environment : createModel(require('models/mongo/environment'), conn),
    ErrorBatch : createModel(require('models/mongo/error_batch'), conn),
    MonitorRes : createModel(require('models/mongo/monitor_res'), conn),
    Kpi : createModel(require('models/mongo/kpi'), conn),
    Endpoint : createModel(require('models/mongo/endpoint'), conn),
    conn
};
