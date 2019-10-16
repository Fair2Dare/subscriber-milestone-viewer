var express = require('express');
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var request = require('request');
var dotenv = require('dotenv');
var path = require('path');
var axios = require('axios');

dotenv.config();

const tokenUserPairs = {};

// Initialize Express and middlewares
var app = express();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
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
app.get(
  '/auth/twitch',
  passport.authenticate('twitch', { scope: 'user_read channel_subscriptions' })
);

// Set route for OAuth redirect
app.get('/auth/twitch/callback', passport.authenticate('twitch'), function(
  req,
  res
) {
  if (req.session && req.session.passport && req.session.passport.user) {
    if (
      !process.env.VALID_USERS.includes(req.session.passport.user.data[0].id)
    ) {
      const newHTML = `
        <html>
          <script>
            window.location.href = '/';
            alert("You are not authorized to use this site. Contact vinmags16@gmail.com for access")
          </script>
        </html>
      `;
      res.send(newHTML);
    } else {
      console.log(
        `Logging in ${req.session.passport.user.data[0].display_name}`
      );
      tokenUserPairs[req.session.passport.user.data[0].id] =
        req.session.passport.user.accessToken;
      res.redirect(
        '/id/' +
          req.session.passport.user.data[0].id +
          '/token/' +
          req.session.passport.user.accessToken
      );
    }
  } else {
    res.redirect('/');
  }
});

app.get('/id/:id/token/:token', function(req, res) {
  if (tokenUserPairs[req.params.id] === req.params.token) {
    console.log(`User ${req.params.id} is authorized`);
    const newHTML = `
      <html>
        <script>
          window.localStorage.setItem('sub_milestone_channel_id', '${req.params.id}');
          window.location.href = '/';
        </script>
      </html>
    `;
    res.send(newHTML);
  } else {
    res.redirect('/');
  }
});

app.get('/channel_subscribers', function(req, res) {
  console.log(`Retrieving subscribers for ${req.query.channelID}`);
  axios
    .get(
      `https://api.twitch.tv/kraken/channels/${req.query.channelID}/subscriptions`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Accept: 'application/vnd.twitchtv.v5+json',
          Authorization: `OAuth ${tokenUserPairs[req.query.channelID]}`
        }
      }
    )
    .then(response => {
      console.log(response.data);
      res.send(response.data);
    })
    .catch(error => {
      console.log(`Error retrieving subscriptions for ${req.query.channelID}`);
      console.log(error.response.data.message);
      res.status(error.response.status).send(error.response.data.message);
    });
});

app.get('/logout', function(req, res) {
  console.log(req.session.passport.user);
  console.log(`Logging out user ${req.params.id}`);
  req.logout();
  delete tokenUserPairs[req.params.id];
  const newHTML = `
      <html>
        <script>
          window.localStorage.removeItem('sub_milestone_channel_id');
          window.location.href = '/';
        </script>
      </html>
    `;
  res.send(newHTML);
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.get('*', function(req, res) {
  res.redirect('/');
});

app.listen(process.env.PORT || 5000);
