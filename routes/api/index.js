'use strict';

let useRoutes = function(app) {
    const protocolRouter = require('./protocol');

    app.use('/api/', protocolRouter);
};

module.exports = exports = {
    useRoutes : useRoutes
};
