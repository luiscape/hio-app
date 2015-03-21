// Loading a configuration file
// from the local file system.
var fs = require('fs');
var chalk = require('chalk');

module.exports = {
  loadConfig: function(c, v) {
    if (!c) {
      console.log(chalk.red('ERROR:') + ' Provide configuration file, i.e. `dev.json`');
      return
    } else {
      var j = require(__dirname + "/" + c);
      console.log(chalk.green('SUCCESS:') + ' Configuration file ' + c + ' loaded successfully.');
    }
    if (v) {
      console.log(chalk.blue("CONFIG FILE:") + JSON.stringify(j));
    }
    return j
  }
}
