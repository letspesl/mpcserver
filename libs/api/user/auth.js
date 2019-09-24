'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    SEnum = require('libs/enum'),
    config = require('config'),
    mongo = require('models/mongo'),
    EosLib = require('libs/chain/eos'),
    FacebookApi = require('external_apis/facebook_api'),
    GoogleApi = require('external_apis/google_api'),
    KakaoApi = require('external_apis/kakao_api'),
    SErr = require('libs/error'),
    Market = require('libs/billing/market');

const eosNodeConf = config.eosNode;
const ethNodeConf = config.ethNode;

const Dapp = mongo.Dapp;
const User = mongo.User;
const UserMig = mongo.UserMig;
const Balance = mongo.Balance;

/* authReq
    - access_token : original access token
    - auth_type : enum auth type
*/
class Auth {
    constructor(authReq) {
        this.authReq = authReq;
    }

    async signIn() {
        let originInfo = null;
        try {
            originInfo = await this.validate(this.authReq);
        } catch (err) {
            throw SErr.create('INVALID_ORIGIN_ACCESS_TOKEN', {err : err, authReq : this.authReq});
        }

        if (_.isEmpty(originInfo)) {
            return null;
        }

        let user = await this.exist(originInfo);
        if (_.isEmpty(user)) {
            const auth_type = originInfo.auth_type || SEnum.USER_TYPE_NORMAL;
            const protocol_type = originInfo.protocol_type || SEnum.PROTOCOL_TYPE_GENERATE_KEY;
            let userInfo = {
                access_token : originInfo.access_token,
                auth_type : auth_type,
                protocol_type: protocol_type
            };
            user = await User.createUser(userInfo);
            await this.postCreate(user);
        }
        return user;
    }

    async exist(originInfo) {
        return User.getUser({
            access_token : originInfo.access_token, 
            auth_type : this.authReq.auth_type, 
            protocol_type: this.authReq.protocol_type
        });
    }

    async validate(authReq) {
    }

    async postCreate(user) {
    }
}

async function signIn(authReq) {
    const auth = new Auth(authReq);
    if (_.isNil(auth)) {
        return null;
    }
    return auth.signIn();
}

module.exports = exports = {signIn};
