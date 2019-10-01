'use strict';

const express = require('express'),
    Protocol = require('libs/api/protocol'),
    SErr = require('libs/error');

const router = express.Router();

const createProtocol = function(req, res, next) {
    Protocol.createProtocol(req.body)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};

const sendBroadcast = function(req, res, next) {
    const protocolId = req.params.protocol_id;
    Protocol.sendBroadcast(protocolId, req.body)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};

const pollBroadcast = function(req, res, next) {
    const protocolId = req.params.protocol_id;
    Protocol.pollBroadcast(protocolId, req.body)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};

const sendPeer = function(req, res, next) {
    const protocolId = req.params.protocol_id;
    Protocol.sendPeer(protocolId, req.body)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};

const pollPeer = function(req, res, next) {
    const protocolId = req.params.protocol_id;
    Protocol.pollPeer(protocolId, req.body)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            SErr.sendRes(res, err);
        });
};


router.post('/1/protocols', createProtocol);

router.post('/1/protocols/broadcast/send/:protocol_id', sendBroadcast);
router.post('/1/protocols/broadcast/poll/:protocol_id', pollBroadcast);

router.post('/1/protocols/peer/send/:protocol_id', sendPeer);
router.post('/1/protocols/peer/poll/:protocol_id', pollPeer);

module.exports = exports = router;