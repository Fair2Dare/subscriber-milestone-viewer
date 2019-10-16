var express = require('express');
var session = require('express-session');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request = require('request');
var dotenv = require('dotenv');

dotenv.config();

// Define our constants, you will change these with your own
const TWITCH_CLIENT_ID = '<YOUR CLIENT ID HERE>';
const TWITCH_SECRET = '<YOUR CLIENT SECRET HERE>';
const SESSION_SECRET = '<SOME SECRET HERE>';
const CALLBACK_URL = '<YOUR REDIRECT URL HERE>'; // You can run locally with - http://localhost:3000/auth/twitch/callback

// Initialize Express and middlewares
var app = express();
app.use(
  session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })
);
app.use(express.static('client/build'));
app.use(passport.initialize());
app.use(passport.session());

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
app.get(
  '/auth/twitch',
  passport.authenticate('twitch', { scope: 'user_read channel_subscriptions' })
);

// Set route for OAuth redirect
app.get(
  '/auth/twitch/callback',
  passport.authenticate('twitch', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/'
  })
);

app.get('/loginSuccess', function(req, res) {
  if (req.session && req.session.passport && req.session.passport.user) {
    res.send(req.session.passport.user);
  }
});

app.get('/', function(req, res) {
  res.send(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(process.env.PORT || 5000);
