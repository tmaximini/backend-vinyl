var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
  username: String,
  discogsInfo: {}
});

module.exports = mongoose.model('User', UserSchema);