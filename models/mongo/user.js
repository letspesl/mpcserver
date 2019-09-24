'use strict';

const _ = require('lodash'),
    config = require('config'),
    jwt = require('jsonwebtoken'),
    SEnum = require('libs/enum'),
    schema = require('./schema');

module.exports = exports = function(mongoose, conn) {
    const Schema = mongoose.Schema;
    class User {
        static getLoginToken(user, accessToken) {
            let login = {};
            login.token = this.encodeToken(user, accessToken);
            login.user = user;
            return login;
        }

        static decodeToken(token) {
            return new Promise(function(resolve, reject) {
                jwt.verify(token, config.passwdSalt, function(err, decode) {
                    if (!_.isEmpty(err)) {
                        reject(err);
                    } else {
                        resolve(decode);
                    }
                });
            });
        }

        static encodeToken(user, accessToken) {
            return jwt.sign({
                accessToken : accessToken,
                _id : user._id
            }, config.passwdSalt);
        }

        static async getUser(where, projection) {
            let user = await this.findOne(where, projection);
            if (_.isEmpty(user)) {
                return {};
            }
            return user.toObject();
        }

        static async createUser(user) {
            const userDoc = await this.create(user);
            return userDoc.toObject();
        }

        static transform(doc, ret, options) {
            if (_.isNil(doc.created_at) || _.isNil(doc.updated_at)) {
                return;
            }
            if (!_.isEmpty(doc.device) && _.isEmpty(doc.device.device_token)) {
                delete ret.device;
            }
            ret.created_at = doc.created_at.getTime();
            ret.updated_at = doc.updated_at.getTime();
        }
    }

    const assetSchema = schema.assetSchema;
    const deviceSchema = schema.deviceSchema;
    const verifSchema = schema.verifSchema;
    /*
    Auth
        AUTH_TYPE_EOS : 0,       // by EOS
        AUTH_TYPE_FB : 1,        // by facebook
        AUTH_TYPE_GG : 2,        // by google
        AUTH_TYPE_KK : 3,        // by kakao
    */
    const userSchema = new Schema({
        name : {type : String, required : false},
        origin_id : {type : String, required : true},
        auth_type : {type : Number, required : true},
        balances : [assetSchema],
        tokens : [assetSchema],
        device : deviceSchema,
        type : {type : Number, required : false, default : SEnum.USER_TYPE_NORMAL},
        pending_tids : {type : [Schema.Types.ObjectId], required : false},
        verif : {type : verifSchema}
    }, {
        virtuals: true,
        toJSON : {transform : User.transform},
        toObject : {transform : User.transform},
        timestamps : {createdAt : 'created_at', updatedAt : 'updated_at'}
    });

    userSchema.index({name : 1});
    userSchema.index({origin_id : 1, auth_type : 1}, {unique : true});
    userSchema.index({created_at : 1});
    userSchema.index({'verif.phone_hash' : 1}, {sparse : true, unique : true});
    userSchema.index({'verif.email' : 1}, {sparse : true, unique : true});

    userSchema.loadClass(User);

    return conn.model('User', userSchema);
};
