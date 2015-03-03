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
    res.json(wantlistDummy);
  })


  .get('/me', function(req, res) {
    // res.json(userDummy);
    if (!req.session.DISCOGS_ACCESS) {
      res.json({ error: 'not logged in' });
    }
    var fromCache = cache.get(req.session.username + '.identity');
    if (fromCache) {
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      dis.identity(function(err, data) {
        cache.set(req.session.username + '.identity', data);
        res.json(data);
      });
    }
  })


  .get('/me/collection', function(req, res) {
    // res.json(collectionDummy);
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    var fromCache = cache.get(req.session.username + '.collection');
    if (fromCache) {
      console.log('from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var collection = dis.user().collection();
      collection.releases(req.session.username, 0, { page: req.query.page || 0, per_page: req.query.perPage || 75}, function(err, data) {
        cache.set(req.session.username + '.collection', data);
        res.send(data);
      });
    }
  })


  .get('/me/wantlist', function(req, res) {
    // res.json(wantlistDummy);
    var fromCache = cache.get(req.session.username + '.wantlist');
    if (fromCache) {
      console.log('wantlist from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var wantlist = dis.user().wantlist();
      wantlist.releases(req.session.username, { page: req.query.page || 0, per_page: req.query.perPage || 75}, function(err, data) {
        cache.set(req.session.username + '.wantlist', data);
        res.send(data);
      });
    }
  });


module.exports = router;
