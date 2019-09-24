'use strict';

let useRoutes = function(app) {
    const userRouter = require('./user');

    app.use('/api/', userRouter);
};

module.exports = exports = {
    useRoutes : useRoutes
};
