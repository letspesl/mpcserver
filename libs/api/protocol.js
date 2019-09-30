'use strict';

const Promise = require('bluebird'),
    _ = require('lodash'),
    Nblocks = require('external_apis/party'),
    config = require('config'),
    mongo = require('models/mongo'),
    SEnum = require('libs/enum'),
    SUtil = require('libs/util'),
    SErr = require('libs/error');

const Protocol = mongo.Protocol;
const Party = mongo.Party;
const Round = mongo.Round;

async function getHosts(parties) {
    return await Promise.map(parties, async function(partyId) {
        const party = await Party.findOne({_id: partyId});
        return party.host;
    });
}

async function createProtocol(reqBody) {
    const partyId = reqBody.party_id;
    const protocolType = reqBody.protocol_type;
    const shareCount = reqBody.share_count;
    const threshold = reqBody.threshold;

    const parties = config.party;
    if(reqBody.hasOwnProperty("parties")) {
        parties = reqBody.parties;
    }
    
    parties.unshift(partyId);
    
    let protocol = await Protocol.create({
        protocol_type: protocolType,
        share_count: shareCount,
        threshold: threshold,
        parties: parties,
    });

    const hosts = await getHosts(parties);
    
    await Promise.each(hosts, async function(host) {
        if(!_.isEqual(host, "device_id")) {
            const body = _.pick(protocol, ['parties_count', 'protocol_type', 'share_count', 'threshold']);
            await Nblocks.inviteParty(host, protocol._id, body);
            await Protocol.updateOne({_id : protocol._id}, {$inc : {parties_count : 1}});
            protocol = await Protocol.findOne({_id: protocol._id});
        }  
    })
    .catch((err) => {
        throw SErr.create('BAD_REQUEST', {hosts : hosts, protocol : protocol, reason : 'createProtocol fail', error : err});
    });

    return protocol;
}

async function sendBroadcast(protocolId, reqBody) {
    const protocol = await Protocol.findOne({_id: protocolId});
    
    const partyId = reqBody.party_id;
    const partyIdx = reqBody.party_idx;
    const round = reqBody.round;
    const value = reqBody.value;

    console.log(typeof partyIdx);
    console.log(typeof round);

    await Promise.map(protocol.parties, async function(party) {      
        if(!_.isEqual(party, partyId)) {
            await Round.create({
                protocol_id : protocol._id,
                step : round,
                data : value,
                from_idx : partyIdx,
                to : party,
            });
        }
    }).catch((err) => {
        throw SErr.create('BAD_REQUEST', {protocol : protocol, reason : 'sendBroadcast fail', error : err});
    });   

    return {protocol_id: protocol._id, round: round};
}

async function pollBroadcast(protocolId, reqBody) { 
    const partyId = reqBody.party_id;
    const step = reqBody.round;

    const rounds = await Round.find({protocol_id: protocolId, step: step, to: partyId});

    let values = rounds.map((round) => {
        return _.pick(round, ['from_idx', 'data']);
    })

    return {size: rounds.length, rounds: JSON.stringify(values)};
}

async function sendPeer(reqBody) {

}

async function pollPeer(reqBody) {
    
}

module.exports = exports = {createProtocol, sendBroadcast, pollBroadcast, sendPeer, pollPeer};