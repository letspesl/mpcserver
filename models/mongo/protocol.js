'use strict';

const SEnum = require('libs/enum'),
    _ = require('lodash'),
    schema = require('./schema');

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema;
    class Protocol {
        static transform(doc, ret, options) {
            if (!_.isNil(doc.created_at)) {
                ret.created_at = doc.created_at.getTime();
            }
            if (!_.isNil(doc.updated_at)) {
                ret.updated_at = doc.updated_at.getTime();
            }
        }
    }

    const protocolSchema = new Schema({
        protocol_type : {type : Number, required : true, default : SEnum.PROTOCOL_TYPE_GENERATE_KEY},
        parties_count : {type : Number, required : true, default : 1},
        share_count : {type : Number, required : true, default : 2},
        threshold : {type : Number, required : true, default : 1},
        parties : {type : Array, required : true},
        completed : {type : Boolean, required : true, default : false}
    }, {
        virtuals: true,
        toJSON : {transform : Protocol.transform},
        toObject : {transform : Protocol.transform},
        timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
    });

    protocolSchema.index({protocol_type : 1});
    protocolSchema.index({parties_count : 1, share_count : 1});
    protocolSchema.index({parties_count : 1, threshold : 1});
    protocolSchema.index({share_count : 1, threshold : 1});
    protocolSchema.index({completed : 1});

    protocolSchema.loadClass(Protocol);

    return conn.model('Protocol', protocolSchema);
};
