'use strict';

const request = require('superagent'),
    _ = require('lodash'),
    url = require('url'),
    SErr = require('libs/error');

const headers = {
    'Content-type' : 'application/x-www-form-urlencoded;charset=utf-8'
};

function inviteParty(host, protocolId, body) {
    const endpoint = url.resolve(host, `api/1/protocols/${protocolId}/invite`);
    const userHeaders = headers;
    return request
        .post(endpoint)
        .send(body)
        .set(userHeaders)
        .then(function(res) {
            if (!_.isNil(res.body.error)) {
                throw SErr.create('BAD_REQUEST', {protocolId : protocolId, body : body, reason : 'from_parties', error : res.body.error});
            }
            return res.body;
        });
}

function broadcastParty(host, protocolId, body) {
    const endpoint = url.resolve(host, `api/1/protocols/${protocolId}/broadcast`);
    const userHeaders = headers;
    return request
        .post(endpoint)
        .send(body)
        .set(userHeaders)
        .then(function(res) {
            if (!_.isNil(res.body.error)) {
                throw SErr.create('BAD_REQUEST', {protocolId : protocolId, body : body, reason : 'from_parties', error : res.body.error});
            }
            return res.body;
        });
}

module.exports = exports = {inviteParty, broadcastParty};
