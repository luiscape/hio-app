     /*
    /
   /   Loading a configuration file
  /    from the local file system.
 /                                  */

var fs      = require('fs');
var path    = require('path');
var chalk   = require('chalk');


module.exports =  function(config_name, verbose) {

  /* default parameter value */
  config_name = typeof config_name !== 'undefined' ? config_name : 'dev';
  verbose = typeof verbose !== 'undefined' ? verbose : false;

  available_configs = ['dev'];

  // Check if the config name exists above.
  if (config_name.indexOf(config_name) == -1) {
    console.log(chalk.red('ERROR:') + ' Provide configuration file, i.e. `dev.json`');
    return false
  } else {
    var json_file = require(__dirname + "/" + '_' + config_name + '.json');
    if (verbose) console.log(chalk.green('SUCCESS:') + ' Configuration file ' + config_name + ' loaded successfully.');
  }
  if (verbose) console.log(chalk.blue("CONFIG FILE:") + JSON.stringify(j));
  return json_file
}
