var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true },
  discogs_username: { type: String, unique: true, lowercase: true },
  discogs_access: {}
});

module.exports = mongoose.model('User', UserSchema);