var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET users listing. */
router
  .get('/', function(req, res) {
    User.find(function(err, users) {
      if (err)
        res.send(err);

      res.json(users);
    });
  })
  .post('/', function(req, res) {
      // create User
  });

module.exports = router;
