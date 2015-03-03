var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET users listing. */
router
  .get('/', function(req, res, next) {
    User.find(function(err, users) {
      if (!err) {
        res.json(users);
      } else {
        next(new Error(err));
      }
    });
  })
  .post('/', function(req, res) {
      // create User
  });

module.exports = router;
