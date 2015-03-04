var express = require('express');
var router = express.Router();
var Discogs = require('disconnect').Client;

var LRU = require('lru-cache');
var cache = new LRU(); // options?

router
  .get('/collection', function(req, res) {
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    var requestedPage = req.query.page || 0;
    var cacheString = req.session.username + '.collection.' + requestedPage;
    var fromCache = cache.get(cacheString);
    if (fromCache) {
      console.log('from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var collection = dis.user().collection();
      collection.releases(req.session.username, 0, { page: requestedPage, per_page: req.query.perPage || 75 }, function(err, data) {
        cache.set(cacheString, data);
        res.send(data);
      });
    }
  })


  .get('/wantlist', function(req, res) {
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    var requestedPage = req.query.page || 0;
    var cacheString = req.session.username + '.wantlist.' + requestedPage;
    var fromCache = cache.get(cacheString);
    if (fromCache) {
      console.log('wantlist from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var wantlist = dis.user().wantlist();
      wantlist.releases(req.session.username, { page: requestedPage || 0, per_page: req.query.perPage || 75}, function(err, data) {
        cache.set(cacheString, data);
        res.send(data);
      });
    }
  })


  .get('/releases/:releaseId', function(req, res) {
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    var cacheString = 'release.' + req.params.releaseId;
    var fromCache = cache.get(cacheString);
    if (fromCache) {
      console.log('release from cache: ', fromCache);
      res.send(fromCache);
    } else {
      var dis = new Discogs().database();
      dis.release(req.params.releaseId, function(err, release) {
        cache.set(cacheString, release);
        res.send(release);
      });
    }
  })


module.exports = router;