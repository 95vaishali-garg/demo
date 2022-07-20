//required module
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const sticky = require('sticky-session');
const cluster = require('cluster');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const slug = require('mongoose-slug-updater');
const i18n = require("./i18n");
app = express();
app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({
  extended: true
}));
require('dotenv').config();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(i18n);

//////////////// port define /////////////////////////////////////
app.set('port', process.env.PORT || 5004);
// socket
const http = require('http').createServer(app);

constant = require('./config/constants');
helper = require('./helper/helper');

if (!sticky.listen(http, app.get('port'))) {

  http.once('listening', function () {
    console.log('Server started on port ' + app.get('port'));
  });

}
else {
  //console.log('- Child server started on port ' + app.get('port') + ' case worker id=' + cluster.worker.id);
}

//****Database connection mongodb using mongoose */
mongoose.plugin(slug);
mongoose.connect('mongodb://localhost/' + constant.DB_NAME, { useCreateIndex: true, useFindAndModify: false, useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once("open", function callback() {
  console.log("Db Connected");
});


//all routes
require('./routes/mainRoutes')(app);




























