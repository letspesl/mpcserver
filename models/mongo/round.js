'use strict';

const SEnum = require('libs/enum'),
    _ = require('lodash'),
    schema = require('./schema');

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema;
    class Round {
        static transform(doc, ret, options) {
            if (!_.isNil(doc.created_at)) {
                ret.created_at = doc.created_at.getTime();
            }
            if (!_.isNil(doc.updated_at)) {
                ret.updated_at = doc.updated_at.getTime();
            }
        }
    }

    const roundSchema = new Schema({
        protocol_id : {type : String, required : true},
        step : {type : Number, required : true},
        data : {type : String, required : true},
        from_idx : {type : Number, required : true},
        to : {type : String, required : false},
    }, {
        virtuals: true,
        toJSON : {transform : Round.transform},
        toObject : {transform : Round.transform},
        timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
    });

    roundSchema.index({protocol_id : 1});
    roundSchema.index({protocol_id : 1, step : 1, to : 1});
    roundSchema.index({protocol_id : 1, step : 1, from_idx : 1, to : 1}, {unique : true});

    roundSchema.loadClass(Round);

    return conn.model('Round', roundSchema);
};
