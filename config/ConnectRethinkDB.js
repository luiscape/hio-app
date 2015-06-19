   /*
  /
 /   Function that connects to RethinkDB.
/                                          */

var r            = require('rethinkdb');
var path         = require('path');
var LoadConfig   = require(path.join(__dirname, 'LoadConfig.js'));


/* Application */

var config = LoadConfig('dev');

module.exports =  function(verbose) {
  verbose = typeof verbose !== 'undefined' ? verbose : false;
  var connection = [];
  r.connect({ host: config.database.name, port: config.database.port }, function(err, conn) {
    if (err) {
      if (verbose) {
        console.log(err)
      };
      return false
    };
    connection = conn;
  });
  return connection
};
