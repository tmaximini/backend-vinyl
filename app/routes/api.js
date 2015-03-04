var express = require('express');
var router = express.Router();
var Discogs = require('disconnect').Client;

var LRU = require('lru-cache');
var cache = new LRU(); // options?

var discogsDb = new Discogs().database();

// redirect user in case we have no Discogs access
var checkForAuth = function(req, res) {
  if (!req.session.DISCOGS_ACCESS) {
    res.redirect('/auth/login');
  }
};

/**
 * checks if we can resolve the request already from cache
 * @param  {Stroing} cacheString
 * @param  {Object}  res        - the response object in case we resolve
 * @return {Boolean}
 */
var tryCache = function(cacheString, res) {
  var fromCache = cache.get(cacheString);
  if (fromCache) {
    console.log('from cache: ', fromCache);
    return res.send(fromCache);
  } else {
    return false;
  }
};

router


  /**
   * COLLECTION
   */

  .get('/collection', function(req, res) {
    checkForAuth(req, res);
    var requestedPage = req.query.page || 1;
    var cacheString = req.session.username + '.collection.' + requestedPage;
    if (!tryCache(cacheString, res)) {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var collection = dis.user().collection();
      collection.releases(req.session.username, 0, { page: requestedPage, per_page: req.query.perPage || 75 }, function(err, data) {
        cache.set(cacheString, data);
        res.send(data);
      });
    }
  })

  /**
   * WANTLIST
   */

  .get('/wantlist', function(req, res) {
    checkForAuth(req, res);
    var requestedPage = req.query.page || 1;
    var cacheString = req.session.username + '.wantlist.' + requestedPage;
    if (!tryCache(cacheString, res)) {
      var dis = new Discogs(req.session.DISCOGS_ACCESS);
      var wantlist = dis.user().wantlist();
      wantlist.releases(req.session.username, { page: requestedPage, per_page: req.query.perPage || 75 }, function(err, data) {
        cache.set(cacheString, data);
        res.send(data);
      });
    }
  })


  /**
   * RELEASES
   */

  .get('/releases/:releaseId', function(req, res) {
    var cacheString = 'release.' + req.params.releaseId;
    var fromCache = cache.get(cacheString);
    if (!tryCache(cacheString, res)) {
      discogsDb.release(req.params.releaseId, function(err, release) {
        cache.set(cacheString, release);
        res.send(release);
      });
    }
  })

  /**
   * ARTISTS
   */

  .get('/artists/:artistId', function(req, res) {
    var cacheString = 'artist.' + req.params.artistId;
    var fromCache = cache.get(cacheString);
    if (!tryCache(cacheString, res)) {
      discogsDb.artist(req.params.artistId, function(err, artist) {
        cache.set(cacheString, artist);
        res.send(artist);
      });
    }
  })

  /**
   * ARTIST RELEASES
   */

  .get('/artists/:artistId/releases', function(req, res) {
    var requestedPage = req.query.page || 1;
    var cacheString = 'artist.' + req.params.artistId + 'releases.' + requestedPage;
    var fromCache = cache.get(cacheString);
    if (!tryCache(cacheString, res)) {
      discogsDb.artistReleases(req.params.artistId, { page: requestedPage }, function(err, releases) {
        cache.set(cacheString, releases);
        res.send(releases);
      });
    }
  })

  /**
   * LABELS
   */

  .get('/labels/:labelId', function(req, res) {
    var cacheString = 'label.' + req.params.labelId;
    var fromCache = cache.get(cacheString);
    if (!tryCache(cacheString, res)) {
      discogsDb.label(req.params.labelId, function(err, label) {
        cache.set(cacheString, label);
        res.send(label);
      });
    }
  })


module.exports = router;