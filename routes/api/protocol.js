'use strict';

const express = require('express'),
    Protocol = require('libs/api/protocol'),
    SErr = require('libs/error');

const router = express.Router();

const createProtocol = function(req, res, next) {
    Protocol.createProtocol(req.body)
        .then((result) => {
            res.json({id: result._id, party_idx: 1});
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};

const sendBroadcast = function(req, res, next) {
    console.log('routes sendBroadcast req.body', req.body);
    const protocolId = req.params.protocol_id;
    Protocol.sendBroadcast(protocolId, req.body)
        .then((result) => {
            console.log('routes sendBroadcast result', result);
            res.json(result);
        })
        .catch((err) => {
            console.log('routes sendBroadcast err', err);
            SErr.sendRes(res, err);
        });
};

const pollBroadcast = function(req, res, next) {
    console.log('routes pollBroadcast req.body', req.body);
    const protocolId = req.params.protocol_id;
    Protocol.pollBroadcast(protocolId, req.body)
        .then((result) => {
            console.log('routes pollBroadcast result', result);
            res.json(result);
        })
        .catch((err) => {
            console.log('routes pollBroadcast err', err);
            SErr.sendRes(res, err);
        });
};

const sendPeer = function(req, res, next) {
    console.log('routes sendPeer req.body', req.body);
    Protocol.sendPeer(req.body)
        .then((result) => {
            console.log('routes sendPeer result', result);
            res.json(result);
        })
        .catch((err) => {
            console.log('routes sendPeer err', err);
            SErr.sendRes(res, err);
        });
};

const pollPeer = function(req, res, next) {
    console.log('routes pollPeer req.body', req.body);
    Protocol.pollPeer(req.body)
        .then((result) => {
            console.log('routes pollPeer result', result);
            res.json(result);
        })
        .catch((err) => {
            console.log('routes pollPeer err', err);
            SErr.sendRes(res, err);
        });
};


router.post('/1/protocols', createProtocol);

router.post('/1/protocols/broadcast/send/:protocol_id', sendBroadcast);
router.post('/1/protocols/broadcast/poll/:protocol_id', pollBroadcast);

router.post('/1/protocols/peer/:protocol_id', sendPeer);
router.get('/1/protocols/peer/:protocol_id', pollPeer);

module.exports = exports = router;