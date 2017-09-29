// App-wide Dependencies
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const app = express();

// Initialize configuration
app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
  secret: 'keyboard cat', 
  cookie: { maxAge: 600000 },
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(express.static(__dirname + '/public'));
app.locals.moment = require("moment");

// Routes
const index = require('./routes/index');
app.use('/', index);

// Fire up the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port ', app.get('port'));
});

module.exports = app;
