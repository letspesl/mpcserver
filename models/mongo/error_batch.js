'use strict';

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema;

    function transform(doc, ret, options) {
        delete ret.extra;
    }

    const errorBatchSchema = new Schema({
        type : {type : String, required : true},                   // billing
        subtype : {type : String, required : false},                // eosio
        reason : {type : String, required : false},
        done : {type : Boolean, required : true, default : false},
        extra : {type : Schema.Types.Mixed},
    }, {
        toJSON : {transform : transform},
        timestamps : {createdAt : 'created_at'}
    });

    errorBatchSchema.index({done : 1, type : 1 });

    return conn.model('ErrorBatch', errorBatchSchema);
};
