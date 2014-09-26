'use strict';

var path = require('path');
var qs = require('querystring');

var Discogs = require('disconnect').Client;
var express = require('express');
var router = express.Router();
var jwt = require('jwt-simple');
var moment = require('moment');
var request = require('request');
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
  return jwt.encode(payload, process.env.TOKEN_SECRET);
}


/*
 |--------------------------------------------------------------------------
 | ROUTING
 |--------------------------------------------------------------------------
 */

router.get('/discogs', function(req, res) {

  var requestTokenUrl = 'http://api.discogs.com/oauth/request_token';
  var accessTokenUrl = 'hhttp://api.discogs.com/oauth/access_token';
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
      var oauthToken = qs.parse(body);
      var params = qs.stringify({ oauth_token: oauthToken.oauth_token });

      // Step 2. Redirect to the authorization screen.
      res.redirect(authenticateUrl + '?' + params);
    });
  } else {
    var accessTokenOauth = {
      consumer_key: process.env.DISCOGS_KEY,
      consumer_secret: process.env.DISCOGS_SECRET,
      token: req.query.oauth_token,
      verifier: req.query.oauth_verifier
    };

    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, profile) {
      profile = qs.parse(profile);

      // Step 4a. Link user accounts.
      if (req.headers.authorization) {
        User.findOne({ discogs: profile.user_id }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Discogs account that belongs to you' });
          }

          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, process.env.TOKEN_SECRET || 'A hard to guess string');

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
          user.twitter = profile.user_id;
          user.displayName = profile.screen_name;
          user.save(function(err) {
            res.send({ token: createToken(req, user) });
          });
        });
      }
    });
  }
});



module.exports = router;