'use strict';

var Discogs = require('disconnect').Client;
var express = require('express');
var router = express.Router();
var User = require('../models/user');

var debug = require('debug')('backend-vinyl');

var requestData, accessData;

router.get('/', function(req, res) {
  var dis = new Discogs();
  dis.getRequestToken(
    process.env.DISCOGS_KEY,
    process.env.DISCOGS_SECRET,
    process.env.DISCOGS_CALLBACK,

    function(err, _requestData){

      requestData = _requestData;

      // Persist "requestData" here so that the callback handler can
      // access it later after returning from the authorize url
      res.redirect(_requestData.authorizeUrl);
    }
  );
});


router.get('/callback', function(req, res) {
  var dis = new Discogs();
    dis.getAccessToken(
      requestData,
      req.query.oauth_verifier, // Verification code sent back by Discogs
      function(err, _accessData) {

        req.session.DISCOGS_ACCESS = accessData = _accessData;
        var dis = new Discogs(req.session.DISCOGS_ACCESS);
        dis.identity(function(err, data){
          req.session.username = data.username;
          res.redirect('/me/collection');
        });

      }
    );
});



module.exports = router;