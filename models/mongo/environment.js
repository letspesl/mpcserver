'use strict';

module.exports = exports = function(mongoose, conn) {
    const _ = require('lodash'),
        SUtil = require('libs/util');

    const Schema = mongoose.Schema;

    class Environment {
        static getEnv(name) {
            return this.findOne({name : 'config'})
                .then(function(env) {
                    if (!_.isEmpty(env)) {
                        return Environment.decrypts(env, env.key);
                    }
                    return {};
                });
        }

        static encrypts(env, key) {
            let envEnc = {};

            return Object.assign({
                name : env.name,
                key : key,
            }, envEnc);
        }

        static decrypts(encEnv, key) {
            let env = {};
            return Object.assign({
                deckey : SUtil.decrypt(key),
                envKey : key,
            }, env);
        }

        static updateConfig(config, env) {
            eosNode.envKey =  env.envKey;
        }
    }

    const envSchema = new Schema({
        name : {type : String, required : true, unique: true},
        key : {type : String, required : true},
    });

    envSchema.loadClass(Environment);

    return conn.model('Environment', envSchema);
};
