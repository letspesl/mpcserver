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
mongoose.set('useUnifiedTopology', true);

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
    Environment : createModel(require('models/mongo/environment'), conn),
    Protocol : createModel(require('models/mongo/protocol'), conn),
    Party : createModel(require('models/mongo/party'), conn),
    Round : createModel(require('models/mongo/round'), conn),
    conn
};
