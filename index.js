var express = require('express');
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request = require('request');
var dotenv = require('dotenv');

dotenv.config();

const tokenUserPairs = {};

// Initialize Express and middlewares
var app = express();
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(express.static('client/build'));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  var options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Accept: 'application/vnd.twitchtv.v5+json',
      Authorization: 'Bearer ' + accessToken
    }
  };

  request(options, function(error, response, body) {
    if (response && response.statusCode == 200) {
      done(null, JSON.parse(body));
    } else {
      done(JSON.parse(body));
    }
  });
};

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(
  'twitch',
  new OAuth2Strategy(
    {
      authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
      tokenURL: 'https://id.twitch.tv/oauth2/token',
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      state: true
    },
    function(accessToken, refreshToken, profile, done) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      // Securely store user profile in your DB
      //User.findOrCreate(..., function(err, user) {
      //  done(err, user);
      //});

      done(null, profile);
    }
  )
);

// Set route to start OAuth link, this is where you define scopes to request
app.get('/auth/twitch', passport.authenticate('twitch', { scope: 'user_read channel_subscriptions' }));

// Set route for OAuth redirect
app.get('/auth/twitch/callback', passport.authenticate('twitch'), function(req, res) {
  if (req.session && req.session.passport && req.session.passport.user) {
    tokenUserPairs[req.session.passport.user.accessToken] = req.session.passport.user.data[0].name;
    res.redirect('/username/' + req.session.passport.user.data[0].name + '/token/' + req.session.passport.user.accessToken);
  } else {
    res.redirect('/');
  }
});

app.get('/username/:username/token/:token', function(req, res) {
  if (tokenUserPairs[req.params.token] === req.params.username) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    res.redirect('/');
  }
});

app.post('/logout', function(req, res) {
  tokenUserPairs.remove(req.body.token);
  res.status(200).done();
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.get('*', function(req, res) {
  res.redirect('/');
});

app.listen(process.env.PORT || 5000);
