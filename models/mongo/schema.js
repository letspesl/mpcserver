'use strict';

const mongoose = require('mongoose'),
    _ = require('lodash'),
    SUtil = require('libs/util');

let Schema = mongoose.Schema;
require('mongoose-long')(mongoose);

let SchemaTypes = mongoose.Schema.Types;

function transform(doc, ret, options) {
    if (_.isNil(doc.amount_ln)) {
        return;
    }
    ret.amount_ln = doc.amount_ln.toString();
    ret.amount_bn = SUtil.lns2Bns(ret.amount_ln, ret);
    if (doc.chain === 'EOS') {
        ret.quantity = SUtil.fromLnAsset({amount_ln : ret.amount_ln, symbol : doc.symbol, precision : doc.precision, precision_ln : doc.precision_ln});
        ret.amount = parseInt(ret.amount_bn);
    } else {
        ret.quantity = SUtil.fromLnAsset({amount_ln : ret.amount_ln, symbol : doc.symbol, precision : doc.precision, precision_ln : doc.precision_ln});
        ret.amount = parseInt(ret.amount_bn);
    }
}

const assetSchema = new Schema({
    chain: {type : String, required : true, default : 'EOS'},
    code : {type : String, required : true},
    symbol : {type : String, required : true},
    amount : {type : Number, required : false},
    amount_ln : {type : SchemaTypes.Long, required : true},
    precision: {type : Number, required : true},
    precision_ln : {type : Number, required : true},
}, {
    toJSON : {transform : transform},
    toObject : {transform : transform},
    _id : false,
    virtual : true
});

assetSchema.index({code : 1, symbol : 1});

const deviceSchema = new Schema({
    os : {type : String, required : false},
    device_token : {type : String, required : false},
    app_version : {type : String, required : false},
    lang_code : {type : String, required : false},
    channel_noti :{type : String, required : false},         // 'y' or 'n',
    channel_send_token : {type : String, required : false},  // 'y' or 'n',
    channel_recv_token : {type : String, required : false},  // 'y' or 'n',
    channel_res : {type : String, required : false},         // 'y' or 'n',
});

const verifSchema = new Schema({
    phone_hash : {type : String, required : false},
    phone_mask : {type : String, required : false},
    email : {type : String, required : false},
}, {_id : false });

module.exports = exports = {assetSchema, deviceSchema, verifSchema};
