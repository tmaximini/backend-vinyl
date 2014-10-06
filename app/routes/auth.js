'use strict';

var path = require('path');
var qs = require('querystring');

var Discogs = require('disconnect').Client;
var OAuth = require('oauth-1.0a');
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
var crypto = require('crypto');
require('request-debug')(request);

var User = require('../models/user');

var debug = require('debug')('backend-vinyl');

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createToken(req, user) {
  var payload = {
    iss: req.hostname,
    sub: user._id,
    iat: moment().unix(),
    exp: moment().add(14, 'days').unix()
  };
  return jwt.encode(payload, process.env.JWT_TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
router.post('/auth/signup', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      return res.status(409).send({ message: 'Email is already taken' });
    }

    var user = new User({
      displayName: req.body.displayName,
      email: req.body.email,
      password: req.body.password
    });

    user.save(function() {
      res.send({ token: createToken(req, user) });
    });
  });
});


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
router.post('/auth/login', function(req, res) {
  User.findOne({ email: req.body.email }, '+password', function(err, user) {
    if (!user) {
      return res.status(401).send({ message: 'Wrong email and/or password' });
    }

    user.comparePassword(req.body.password, function(err, isMatch) {
      if (!isMatch) {
        return res.status(401).send({ message: 'Wrong email and/or password' });
      }
      res.send({ token: createToken(user) });
    });
  });
});


/*
 |--------------------------------------------------------------------------
 | OAuth 1.0 DISCOGS
 |--------------------------------------------------------------------------
 */

router.get('/discogs', function(req, res) {

  var requestTokenUrl = 'http://api.discogs.com/oauth/request_token';
  var accessTokenUrl = 'http://api.discogs.com/oauth/access_token';
  var authenticateUrl = 'http://www.discogs.com/oauth/authorize';
  var userApiUrl = 'https://api.discogs.com';

  if (!req.query.oauth_token || !req.query.oauth_verifier) {
    var requestTokenOauth = {
      consumer_key: process.env.DISCOGS_KEY,
      consumer_secret: process.env.DISCOGS_SECRET,
      callback: process.env.DISCOGS_CALLBACK
    };

    // Step 1. Obtain request token for the authorization popup.
    request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
      var queryParams = qs.parse(body);

      req.session.oauthTokenSecret = queryParams.oauth_token_secret;
      req.session.oauthToken = queryParams.oauth_token;

      var params = qs.stringify(queryParams);

      // Step 2. Redirect to the authorization screen.
      res.redirect(authenticateUrl + '?' + params);
    });
  } else {


    var accessTokenOauth = {
      oauth_consumer_key: process.env.DISCOGS_KEY,
      oauth_nonce: crypto.pseudoRandomBytes(32).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Date.now(),
      oauth_token: req.query.oauth_token,
      oauth_version: '1.0'
    };

    var oa = new OAuth({consumer: { public: process.env.DISCOGS_KEY, secret: process.env.DISCOGS_SECRET }});
    var authObj = oa.authorize({ method: 'POST', url: accessTokenUrl+'?oauth_verifier='+req.query.oauth_verifier }, { public: req.query.oauth_token, secret: req.session.oauthTokenSecret });
    var auth_header = oa.toHeader(authObj).Authorization;

    var headers = {
      'User-Agent': 'Satellizer/Vinyl',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': auth_header
    };

    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({ url: accessTokenUrl, headers: headers }, function(err, response, body) {

      if (err) {
        console.error('error', err);
        res.send(err);
      }

      var profile = qs.parse(body);

      console.log('step3', profile);

      // Step 4a. Link user accounts.
      if (req.headers.authorization) {
        User.findOne({ discogs: profile.user_id }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Discogs account that belongs to you' });
          }

          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, process.env.JWT_TOKEN_SECRET || 'A hard to guess string');

          console.log('step4a', payload);

          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.discogs = profile.user_id;
            user.displayName = user.displayName || profile.screen_name;
            user.save(function(err) {
              res.send({ token: createToken(req, user) });
            });
          });
        });
      } else {
        // Step 4b. Create a new user account or return an existing one.
        User.findOne({ discogs: profile.user_id }, function(err, existingUser) {
          if (existingUser) {
            return res.send({ token: createToken(req, existingUser) });
          }
          var user = new User();
          user.discogs = profile.user_id;
          user.displayName = profile.screen_name;
          console.log('step4b', user);
          user.save(function(err) {
            res.send({ token: createToken(req, user) });
          });
        });
      }
    });
  }
});


module.exports = router;