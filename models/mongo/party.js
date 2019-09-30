'use strict';

const SEnum = require('libs/enum'),
    _ = require('lodash'),
    schema = require('./schema');

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema;
    class Party {
        static transform(doc, ret, options) {
            if (!_.isNil(doc.created_at)) {
                ret.created_at = doc.created_at.getTime();
            }
            if (!_.isNil(doc.updated_at)) {
                ret.updated_at = doc.updated_at.getTime();
            }
        }
    }

    const partySchema = new Schema({
        name : {type : String, required : false},
        host : {type : String, required : true},
    }, {
        virtuals: true,
        toJSON : {transform : Party.transform},
        toObject : {transform : Party.transform},
        timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
    });

    partySchema.index({name : 1}, {unique : true});
    partySchema.index({host : 1}, {unique : true});

    partySchema.loadClass(Party);

    return conn.model('Party', partySchema);
};
