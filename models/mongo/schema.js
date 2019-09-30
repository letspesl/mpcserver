'use strict';

const mongoose = require('mongoose'),
    _ = require('lodash'),
    SUtil = require('libs/util');

let Schema = mongoose.Schema;

const deviceSchema = new Schema({
    os : {type : String, required : false},
    device_token : {type : String, required : false},
    app_version : {type : String, required : false},
    lang_code : {type : String, required : false},
});

module.exports = exports = {deviceSchema};
