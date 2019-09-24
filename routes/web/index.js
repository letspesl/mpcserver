'use strict';

let useRoutes = function(app) {
    app.use('/', function(req, res, next) {
        res.send('mpcrypto-server');
    });
};

module.exports = exports = {
    useRoutes : useRoutes
};