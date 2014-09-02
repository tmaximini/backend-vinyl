var express = require('express');
var router = express.Router();
var Discogs = require('disconnect').Client;


/* GET home page. */
router
  .get('/', function(req, res) {
    res.render('index', { title: 'Express' });
  })
  .get('/me', function(req, res) {
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    var dis = new Discogs(req.session.DISCOGS_ACCESS);
    dis.identity(function(err, data){
      res.send(data);
    });
  })
  .get('/me/collection', function(req, res) {
    if (!req.session.DISCOGS_ACCESS) {
      res.redirect('/auth');
    }
    console.log(req.session.DISCOGS_ACCESS);
    var dis = new Discogs(req.session.DISCOGS_ACCESS);
    var collection = dis.user().collection();
    collection.releases(req.session.username, 0, {page:0, per_page:75}, function(err, data){
      res.send(data);
    });
  })
  .get('/me/wantlist', function(req, res) {
    var dis = new Discogs(req.session.DISCOGS_ACCESS);
    var wantlist = dis.user().wantlist();
    res.send(wantlist);
  })


module.exports = router;
