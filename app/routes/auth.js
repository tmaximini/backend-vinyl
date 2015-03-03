'use strict';

var Discogs = require('disconnect').Client;
var express = require('express');
var router = express.Router();
var User = require('../models/user');

var debug = require('debug')('backend-vinyl');

var requestData, accessData;

function storeUserData(data, res, cb) {
  var user = new User(data);
  user.save(function(err, savedUser) {
    if (!err) {
      console.log('user saved: ', savedUser);
      cb();
    } else {
      console.error(err);
      res.send(403, { message: err });
    }
  });
}

router

  .get('/', function(req, res) {
    var dis = new Discogs();
    console.log(process.env);
    dis.getRequestToken(
      process.env.DISCOGS_KEY,
      process.env.DISCOGS_SECRET,
      process.env.DISCOGS_CALLBACK,

      function(err, _requestData) {
        console.log(_requestData);

        requestData = _requestData;

        // Persist "requestData" here so that the callback handler can
        // access it later after returning from the authorize url
        res.redirect(_requestData.authorizeUrl);
      }
    );
  })

  // dummy function to check MongoDB connectivity
  .get('/callback', function(req, res) {

    var userData = {
      name: 'Bernd',
      discogs_username: 'bernd',
      email: 'bernd@gmail.com'
    };
    storeUserData(userData, res);
  })


  .get('/discogs', function(req, res) {
    var dis = new Discogs();
    console.log('callback!');
    dis.getAccessToken(
      requestData,
      req.query.oauth_verifier, // Verification code sent back by Discogs
      function(err, _accessData) {
        console.log('_accessData: ', _accessData);
        // this should be stored in the user model
        req.session.DISCOGS_ACCESS = accessData = _accessData;
        var dis = new Discogs(req.session.DISCOGS_ACCESS);
        dis.identity(function(err, data) {

          // authentication was successful
          var userData = {
            name: data.username,
            discogs_username: data.username,
            discogs_access: req.session.DISCOGS_ACCESS
          };
          storeUserData(userData, res, function() {
            res.redirect('/me/collection');
          });

        });
      }
    );
  });

module.exports = router;