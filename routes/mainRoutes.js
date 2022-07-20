module.exports = function (app) {
    // importing routes files for routes /////

    var user = require('./customer/users');
    app.use('/api/v1/user', user);

    //admin panel routes
    var adminSetting = require('./admin/admin');
    app.use('/api/v1/admin', adminSetting);

   
};