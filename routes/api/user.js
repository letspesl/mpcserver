'use strict';

const express = require('express'),
    User = require('libs/api/user'),
    SErr = require('libs/error');

const router = express.Router();

const signin = function(req, res, next) {
    User.signin(req)
        .then((signin) => {
            console.log(signin);
            res.json({signin : signin});
        })
        .catch((err) => {
            console.log(err);
            SErr.sendRes(res, err);
        });
};

router.post('/1/users', signin);

module.exports = exports = router;
