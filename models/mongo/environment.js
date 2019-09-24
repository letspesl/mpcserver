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
            if (!_.isEmpty(env.fb)) {
                envEnc.fb = SUtil.encrypt(JSON.stringify(env.fb), key);
            }
            if (!_.isEmpty(env.emails)) {
                envEnc.emails = SUtil.encrypt(JSON.stringify(env.emails), key);
            }

            return Object.assign({
                name : env.name,
                market_seed_enc : SUtil.encrypt(env.marketSeed, key),
                nblocks_pvt_enc : SUtil.encrypt(env.eosNode.nblocksPvt, key),
                nblocks_agent : env.eosNode.nblocksAgent,
                nblocks_permission : env.eosNode.nblocksPermission,
                google : {
                    fcm_enc : SUtil.encrypt(env.google.fcm, key),
                    client_id_enc : SUtil.encrypt(env.google.clientId, key),
                    google_public_key_live_enc : SUtil.encrypt(env.google.googlePublicKeyStrLive, key),
                },
                key : key,
            }, envEnc);
        }

        static decrypts(encEnv, key) {
            let env = {};
            if (!_.isEmpty(encEnv.fb)) {
                env.fb = JSON.parse(SUtil.decrypt(encEnv.fb, key));
            }
            if (!_.isEmpty(encEnv.emails)) {
                env.emails = JSON.parse(SUtil.decrypt(encEnv.emails, key));
            }
            return Object.assign({marketSeed : SUtil.decrypt(encEnv.market_seed_enc, key),
                eosNode : {
                    nblocksPvtEnc : encEnv.nblocks_pvt_enc,
                    nblocksAgent : encEnv.nblocks_agent,
                    nblocksPermission : encEnv.nblocks_permission,
                },
                google : {
                    fcm : SUtil.decrypt(encEnv.google.fcm_enc, key),
                    clientId : SUtil.decrypt(encEnv.google.client_id_enc, key),
                    googlePublicKeyStrLive : SUtil.decrypt(encEnv.google.google_public_key_live_enc, key)
                },
                envKey : key,
            }, env);
        }

        static updateConfig(config, env) {
            const eosNode = config.eosNode || {};
            const google = config.google || {};

            eosNode.nblocksPvtEnc = env.eosNode.nblocksPvtEnc,
            eosNode.nblocksAgent = env.eosNode.nblocksAgent;
            eosNode.nblocksPermission = env.eosNode.nblocksPermission;
            eosNode.envKey =  env.envKey;

            google.fcm = env.google.fcm;

            google.clientId = env.google.clientId;
            google.googlePublicKeyStrLive = env.google.googlePublicKeyStrLive;

            config.eosNode = eosNode;
            config.google = google;
            config.marketSeed = env.marketSeed;
            config.fb = env.fb;
            config.emails = env.emails;
        }
    }

    const googleSchema = new Schema({
        fcm_enc : {type : String, required : true},
        client_id_enc : {type : String, required : true},
        google_public_key_live_enc : {type : String, required : true},
    }, { _id : false });

    const envSchema = new Schema({
        name : {type : String, required : true, unique: true},
        nblocks_pvt_enc : {type : String, required : true},
        nblocks_agent : {type : String, required : true},
        nblocks_creator : {type : String, required : true},
        nblocks_permission : {type : String, required : true},
        market_seed_enc : {type : String, required : true},
        google : googleSchema,
        key : {type : String, required : true},
        fb : {type : String, required : true},
        emails : {type : String, required : true},
    });

    envSchema.loadClass(Environment);

    return conn.model('Environment', envSchema);
};
