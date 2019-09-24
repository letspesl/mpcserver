'use strict';

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema,
        schema = new Schema({
            eos_lib_block_id : {type : String},
            eos_lib_block_num : {type : Number},
            eos_block_id : {type : String},
            eos_block_num : {type : Number},
            eth_lib_block_id : {type : String},
            eth_lib_block_num : {type : Number},
            eth_block_id : {type : String},
            eth_block_num : {type : Number},
        }, {
            timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
        });
    return conn.model('Summary', schema);
};
