'use strict';

let Promise = require('bluebird'),
    _ = require('lodash'),
    crypto = require('crypto'),
    request = require('request'),
    numeral = require('numeral'),
    config = require('config'),
    RedisClient = require('models/redis'),
    SEnum = require('libs/enum');

let createHash = function(seed, salt) {
    let sha256 = crypto.createHash('sha256');
    sha256.update(seed + salt);
    return sha256.digest('hex');
};

let createAccessToken = function(seed, salt) {
    return createHash(seed, salt + config.salt);
};

function requestPro(options) {
    _.defaults(options, {timeout : 20000});
    return new Promise(function(resolve, reject) {
        request(options, function(err, response, body) {
            if (!_.isEmpty(err)) {
                reject(err);
            } else {
                resolve([response, body]);
            }
        });
    });
}

function requestLoopPro(options, maxLoopCount, timeout, count) {
    count = count || 0;
    return requestPro(options)
    .catch(function(err) {
        if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
            if (count < maxLoopCount) {
                options.timeout = timeout;
                return requestLoopPro(options, maxLoopCount, timeout, ++count);
            }
        }
        throw err;
    });
}

function toCamelCaseKey(map) {
    let ccMap = {};
    _.forEach(map, function(value, key) {
        ccMap[_.camelCase(key)] = value;
    });
    return ccMap;
}

function toLowerCaseKey(map) {
    return Object.keys(map).reduce((c, k) => (c[k.toLowerCase()] = map[k], c), {});
}

// nblocks|android|playstore|0.9.4|4.4.4|SHV-E210S|samsung|langCode'
function parseUserAgent(userAgent) {
    if (_.isEmpty(userAgent)) {
        return {};
    }
    userAgent = userAgent.toLowerCase();
    let userAgentKey = ['appName', 'os', 'store', 'appVersion', 'buildVersion', 'modelName', 'company', 'langCode'],
        mapUserAgent = {},
        arrUserAgent = userAgent.split('|');

    _.forEach(arrUserAgent, (element, index) => mapUserAgent[userAgentKey[index]] = element);
    return mapUserAgent;
}

function getLangCode(langCode) {
    if (_.isEmpty(langCode)) {
        return 'en';
    }
    const lang = langCode.split('-')[0];
    if (_.indexOf(config.supportLangCodes, lang) === -1) {
        return 'en';
    }
    return lang;
}

async function xLockOrder(compositKey, doc, expire) {
    const redis = new RedisClient(SEnum.REDIS_TYPE_X_LOCK, [compositKey]);
    return await redis.xLockOrder(doc, expire);
}

// const key = '12345678901234567890123456789012'; // Must be 256 bits (32 characters)
function encrypt(text, _key) {
    const key = _changeKey(_key);
    const IV_LENGTH = 16;  // For AES, this is always 16
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text, _key) {
    if (_.isEmpty(text)) {
        return '';
    }
    const key = _changeKey(_key);
    let textParts = text.split(':');
    let iv = new Buffer.from(textParts.shift(), 'hex');
    let encryptedText = new Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function _changeKey(key) {
    const seed = key.split('').sort().join('').toUpperCase();
    return createHash(seed, '123123123').substr(3, 32);
}

let getReview = async function(dappId) {
    try {
        const cachedSession = new RedisClient(SEnum.REDIS_TYPE_REVIEW, [dappId]);
        const reviewJson = await cachedSession.restoreAsync();
        if (_.isEmpty(reviewJson)) {
            return null;
        }
        return JSON.parse(reviewJson);
    } catch (err) {
        return null;
    }
};

function createCheckPoints() {
    let points = [];
    function addCheckPoint(date, msg) {
        let length = points.length;
        if (length === 0) {
            points.push({start : date, end : date, msg : 'start'});
        } else {
            const prev = points[length - 1];
            const duration = date - prev.end;
            points.push({start : prev.end, end : date, duration, msg});
        }
        return points;
    }

    function finish() {
        let maxDuration = 0;
        let maxPoint = null;
        _.forEach(points, (point, index) => {
            if (maxDuration < point.duration) {
                maxPoint = point;
                maxDuration = point.duration;
            }
        });
        let latency = _.last(points).end - _.first(points).start;
        let ordered = _.orderBy(points, ['duration'], ['desc']);
        ordered = _.filter(ordered, (point) => {
            if (point.duration > 10) {
                return true;
            }
        });
        points = _.filter(points, (point) => {
            if (point.duration > 5) {
                return true;
            }
        });
        return {
            latency,
            maxDuration,
            maxPoint,
            ordered,
            points
        };
    }

    return {
        addCheckPoint,
        finish
    };
}

function maskPhoneNumber(phoneNumber) {
    const pattern = /(\d)\d(\d)\d$/;
    return phoneNumber.replace(pattern, '$1*$2*');
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function toAsset(quantity, code, chain) {
    const arr = quantity.split(' ');
    const numArr = arr[0].split('.');
    let precision = 0;
    if (numArr.length === 2) {
        precision = numArr[1].length;
    }
    let precisionNum = Math.pow(10, precision);
    let whole = numArr[0], fraction = numArr[1];
    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }

    let amount = (whole * precisionNum) + (fraction * 1);
    let asset = {amount : amount, symbol : arr[1], precision};
    if (!_.isNil(code)) {
        asset.code = code;
    }
    if (!_.isNil(chain)) {
        asset.chain = chain;
    }
    return asset;
    // return {amount : parseInt(parseFloat(arr[0]) * precisionNum), symbol : arr[1], precision, code, chain};
}

function fromAsset({amount, precision, symbol}) {
    let precisionNum = Math.pow(10, precision);
    let format = _.padEnd('0.', precision + 2, '0');
    return `${numeral(amount / precisionNum).format(format)} ${symbol}`;
}

function mergeAssets(assets) {
    return assets.reduce((res, _asset) => {
        const where = {code : _asset.code, symbol : _asset.symbol};
        if (!_.isNil(_asset.chain)) {
            where.chain = _asset.chain;
        }
        const asset = _.find(res, where);
        if (!_.isEmpty(asset)) {
            asset.amount = parseInt(asset.amount) + parseInt(_asset.amount);
        } else {
            res.push(_asset);
        }
        return res;
    }, []);
}


function toLnAsset(quantity, code, chain, precision, precisionLn) {
    const arr = quantity.split(' ');
    const numArr = arr[0].split('.');

    if (_.isNil(precisionLn)) {
        if (numArr.length === 2) {
            precisionLn = numArr[1].length;
        } else {
            precisionLn = 0;
        }
    }
    if (_.isNil(precision)) {
        precision = precisionLn;
    }

    let precisionValue = _.reduce(_.times(precisionLn), (v, s) => {
        return v + '0';
    }, '1');

    let whole = numArr[0], fraction = numArr[1];
    if (!whole) { whole = '0'; }
    if (!fraction) { fraction = '0'; }

    let diff = precisionLn - fraction.length;
    if (diff < 0) {
        fraction = fraction.slice(0, diff);
    } else if (diff > 0) {
        fraction = fraction + Array(diff + 1).join('0');
    }

    let amountLn = BigInt(whole) * BigInt(precisionValue) + BigInt(fraction);
    let amountBn =  lns2Bns(amountLn.toString(), {precision, precision_ln :precisionLn});
    let asset = {
        amount_bn : amountBn,
        amount_ln : amountLn.toString(),
        symbol : arr[1],
        precision : precision,
        precision_ln : precisionLn
    };
    if (!_.isNil(code)) {
        asset.code = code;
    }
    if (!_.isNil(chain)) {
        asset.chain = chain;
    }
    return asset;
}

function fromLnAsset({amount_ln, precision, symbol, precision_ln}) {
    if (precision_ln === undefined) {
        precision_ln = precision;
    }
    let precisionValue = _.reduce(_.times(precision_ln), (v, s) => {
        return v + '0';
    }, '1');
    let amountLn = BigInt(amount_ln);
    let beforeDecimal = amountLn / BigInt(precisionValue);
    let afterDecimal = amountLn % BigInt(precisionValue);

    if (beforeDecimal <= 0) {
        beforeDecimal = '0';
    }

    if (afterDecimal <= 0) {
        afterDecimal = '';
    } else {
        afterDecimal = afterDecimal.toString();
        while (afterDecimal.length < precision_ln) {
            afterDecimal = '0' + afterDecimal;
        }
    }

    let quantity = null;
    /*
    if (precision_ln === undefined) {
        if (beforeDecimal === '0') {
            if (afterDecimal !== '0') {
                var sigFigs = afterDecimal.match(/^0*(.{2})/); // default: grabs 2 most significant digits
                if (sigFigs) {
                    afterDecimal = sigFigs[0];
                }
                formatted = '0.' + afterDecimal + ` ${symbol}`;
            }
        } else {
            formatted = beforeDecimal + '.' + afterDecimal.slice(0, 4) + ` ${symbol}`;
        }
    } else {
    */

    afterDecimal += Array(precision_ln + 1).join('0');
    if (precision_ln > 0) {
        quantity = beforeDecimal + '.' + afterDecimal.slice(0, precision_ln) + ` ${symbol}`;
    } else {
        quantity = beforeDecimal + ` ${symbol}`;
    }
    return quantity;
}

function mergeLnAssets(assets) {
    return assets.reduce((res, _asset) => {
        const where = {code : _asset.code, symbol : _asset.symbol};
        if (!_.isNil(_asset.chain)) {
            where.chain = _asset.chain;
        }
        if (_.isNil(_asset.amount_bn)) {
            _asset.amount_bn = lns2Bns(_asset.amount_ln.toString(), _asset);
        }
        const asset = _.find(res, where);
        if (!_.isEmpty(asset)) {
            asset.amount_ln = BigInt(asset.amount_ln) + BigInt(_asset.amount_ln);
            asset.amount_bn = BigInt(asset.amount_bn) + BigInt(_asset.amount_bn);

            asset.amount_ln = asset.amount_ln.toString();
            asset.amount_bn = asset.amount_bn.toString();
        } else {
            _asset.amount_ln = _asset.amount_ln.toString();
            _asset.amount_bn = _asset.amount_bn.toString();
            res.push(_asset);
        }
        return res;
    }, []);
}

function lns2Bns(lns, {precision, precision_ln}) {
    const diff = precision - precision_ln;
    /*
    if (diff < 0) {
        return lns.slice(0, diff);
    }
    */
    return lns + Array(diff + 1).join('0');
}

function bns2Lns(bns, {precision, precision_ln}) {
    const diff = precision - precision_ln;
    return bns.slice(0, -diff);
}

function toBns({amount_ln, precision, precision_ln}) {
    return lns2Bns(amount_ln, {precision, precision_ln});
}

function addBn(a, b) {
    if (typeof a === 'string') {
        a = BigInt(a);
    }
    if (typeof b === 'string') {
        b = BigInt(b);
    }
    return (a + b).toString();
}

function subBn(a, b) {
    if (typeof a === 'string') {
        a = BigInt(a);
    }
    if (typeof b === 'string') {
        b = BigInt(b);
    }
    return (a - b).toString();
}

module.exports = {
    createHash, createAccessToken,
    requestPro, requestLoopPro,
    toCamelCaseKey, toLowerCaseKey,
    parseUserAgent,
    getLangCode,
    xLockOrder,
    encrypt, decrypt, getReview,
    createCheckPoints,
    maskPhoneNumber,
    random,
    toAsset, fromAsset, mergeAssets,
    toLnAsset, fromLnAsset, mergeLnAssets,
    lns2Bns, bns2Lns, toBns, addBn, subBn,
};
