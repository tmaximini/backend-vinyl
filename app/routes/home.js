var express = require('express');
var router = express.Router();
var Discogs = require('disconnect').Client;

var LRU = require('lru-cache');
var cache = new LRU(); // options?


/* GET home page. */
router
  .get('/', function(req, res) {
    res.render('index', { title: 'Express' });
  })
  .get('/me', function(req, res) {
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
      collection.releases(req.session.username, 0, { page: req.params.page || 0, per_page: req.params.perPage || 75}, function(err, data) {
        cache.set(req.session.username + '.collection', data);
        res.send(data);
      });
    }

  })
  .get('/me/wantlist', function(req, res) {
    var fromCache = cache.get(req.session.username + '.wantlist');
    if (fromCache) {
      console.log('wantlist from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var wantlist = dis.user().wantlist();
      wantlist.releases(req.session.username, { page: req.params.page || 0, per_page: req.params.perPage || 75}, function(err, data) {
        cache.set(req.session.username + '.wantlist', data);
        res.send(data);
      });
    }
  });


module.exports = router;
