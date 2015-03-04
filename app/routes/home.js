var express = require('express');
var router = express.Router();
var Discogs = require('disconnect').Client;

var LRU = require('lru-cache');
var cache = new LRU(); // options?

var wantlistDummy = require('../fixtures/wantlist');
var collectionDummy = require('../fixtures/collection');
var userDummy = require('../fixtures/user');

/* GET home page. */
router

  .get('/', function(req, res) {
    res.render('index', { title: 'Welcome to vinyl.io' });
  })

  .get('/me', function(req, res) {
    //res.json(userDummy);
    if (!req.session.DISCOGS_ACCESS) {
      console.log('not logged in');
      res.json({ error: 'not logged in' });
    }
    var fromCache = cache.get(req.session.username + '.identity');
    if (fromCache) {
      res.send(fromCache);
    } else {
      console.log('req.session.DISCOGS_ACCESS: ', req.session.DISCOGS_ACCESS);
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      dis.identity(function(err, data) {
        cache.set(req.session.username + '.identity', data);
        res.json(data);
      });
    }
  });


module.exports = router;
