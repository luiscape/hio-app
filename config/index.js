   /*
  /
 /   Index for the config functions.
/                                      */

var path = require('path');
// module.exports = require('requireindex')(__dirname);
module.exports = require(path.join(__dirname, 'LoadConfig.js'));
module.exports = require(path.join(__dirname, 'ConnectRethinkDB.js'));