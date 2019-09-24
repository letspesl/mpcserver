'use strict';

module.exports = exports = function(mongoose, conn) {
    const SEnum = require('libs/enum');

    const Schema = mongoose.Schema;
    const endpointSchema = new Schema({
        host : {type : String, required : true},
        status : {type : Number, required : true, default : SEnum.ENDPOINT_STATUS_ACTIVE},
        latency : {type : Number, default : Infinity},
        diff : {type : Number, default : Infinity}
    }, {
        timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
    });

    endpointSchema.index({host : 1}, {unique : true});
    endpointSchema.index({status : 1});
    endpointSchema.index({latency : 1});

    return conn.model('Endpoint', endpointSchema);
};
