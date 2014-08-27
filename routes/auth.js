'use strict';

var Discogs = require('disconnect').Client;
var express = require('express');
var router = express.Router();
var debug = require('debug')('backend-vinyl');

var requestData, accessData;

router.get('/', function(req, res) {
  var dis = new Discogs();
  dis.getRequestToken(
    'DsEvNWcHepADZKygepwO',
    'lcgkGWEVfGwHNQgJwHuHIxEjXzGSDjtq',
    'http://localhost:3000/auth/callback',
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
        accessData = _accessData;
        // From this point on we no longer need "requestData", so it can be deleted.
        // Persist "accessData" here for following OAuth calls
        debug('access token received: ' + accessData);
        res.send('Received access token! ' + accessData);
      }
    );
});


module.exports = router;