'use strict';

var Discogs = require('disconnect').Client;
var express = require('express');
var router = express.Router();
var User = require('../models/user');

var debug = require('debug')('backend-vinyl');

var requestData, accessData;

function storeUserData(data, res, cb) {
  User.update({ name: data.name, discogs_username: data.discogs_username } , data, { upsert: true }, function(err, rowsAffected, savedUser) {
    if (!err) {
      console.log('user upserted: ', savedUser);
      cb();
    } else {
      console.error(err);
      res.send(403, { message: err });
    }
  });
}

router

  .get('/', function(req, res) {
    res.redirect('/auth/login');
  })

  .get('/login', function(req, res) {
    var oauth = new Discogs().oauth();
    // console.log(process.env);
    oauth.getRequestToken(
      process.env.DISCOGS_KEY,
      process.env.DISCOGS_SECRET,
      process.env.DISCOGS_CALLBACK,

      function(err, _requestData) {
        // Persist "requestData" here so that the callback handler can
        // access it later after returning from the authorize url
        requestData = _requestData;
        res.redirect(_requestData.authorizeUrl);
      }
    );
  })


  .get('/discogs', function(req, res, next) {
    var oauth = new Discogs(requestData).oauth();
    console.log('callback!', req.query.oauth_verifier);
    oauth.getAccessToken(
      req.query.oauth_verifier, // Verification code sent back by Discogs
      function(err, _accessData) {
        console.log('_accessData: ', _accessData);
        // this should be stored in the user model
        req.session.DISCOGS_ACCESS = accessData = _accessData;
        var dis = new Discogs(req.session.DISCOGS_ACCESS);
        dis.identity(function(err, data) {
          if (err) {
            return next(new Error(err));
          } else {
            console.log('data: ', data);
          // authentication was successful
          var userData = {
            name: data.username,
            discogs_username: data.username,
            discogs_access: req.session.DISCOGS_ACCESS
          };
          req.session.username = data.username;
          storeUserData(userData, res, function() {
            res.redirect('/api/collection');
          });
          }
        });
      }
    );
  });


module.exports = router;