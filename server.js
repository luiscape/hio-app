#!/bin/env node

// Loading dependencies.
// Note: many libraries are merely experimental.
// The ones maked with '*' are the essential ones for
// the proper working of the application.
var express = require('express'); // (*) call express
var app = express(); // (*) define our app using express
var bodyParser = require('body-parser');
var chalk = require('chalk'); // for printing colorful logs
var fs = require('fs'); // (*) use the file system
var url = require('url');
var request = require('request');
var path = require('path');
var Zip = require('adm-zip');
var unzip = require('unzip');
var http = require('http');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var methodOverride = require('method-override');
var parsecsv = require('csv-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var r = require('rethinkdb');

// Loading configuration
var c = require('./config/LoadConfig');
var config = c.LoadConfig("dev.json");


//===============================//
//_____ Express Configuration ___//
//_______________________________//

app.use(cors()); // allowing CORS request
app.use(bodyParser());
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
  type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({
  extended: true
})); // parse application/x-www-form-urlencoded
app.use(
  methodOverride('X-HTTP-Method-Override')
); // simulate DELETE/PUT

app.use(require('morgan')('dev')); // for logging
app.use(express.static(path.join(__dirname, 'assets'))); // serving static content
app.use(express.static(path.join(__dirname, 'views'))); // serving static content

// configuration for the port to use.
// the first uses a local port. the second
// uses a openshift environment variable
// to determine what port to use.
var port = process.env.PORT || 8000; // for local
if (process.env.OPENSHIFT_NODEJS_PORT) { // for remote
  var port = process.env.OPENSHIFT_NODEJS_PORT || 8000
  var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
}

// connect to rethinkdb
var connection = null;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if (err) throw err;
    connection = conn;
})

// effectivelly connecting to mongodb
// improve function:
// - log errors
// - log successes
connectToDb = function() {
  mongoose.connect(mongodb_connection_string);
  c = mongoose.connection;
  return (c)
};

var conn = connectToDb();

// loading the shema models for the
// different collections in the database
var Indicator = require('./models/indicators');
var Value = require('./models/values');
var Source = require('./models/sources');
var Locations = require('./models/locations');

// Loading visualization functions
// require('./viz/gaul.js')


// ROUTES
// =============================================================================
// This section configures the HTTP routes for the application.
// The fist part determines global variables.
// The second the specific routes to be used.
var router = express.Router();

// Log to use for all requests.
router.use(function(req, res, next) {
  console.log(chalk.blue('Activity:') + ' request made.');
  next();
});

// REFACTORING ======================================
// TODO: parametrizing the application properly
// configuring handling of parameters
app.param('region', function(req, res, next, region) {
  Value.find(region, function(err, user) {
    if (err) return next(err);

    req.region = region;
    next();
  });
});

// INDEX
router.get("/", function(req, res) {
  res.sendfile("views/index.html");
});

// ADDING UI VIEWS
router.get("/gaul", function(req, res) {
  res.sendfile("views/gaul.html");
});

// ADDING UI VIEWS
router.get("/indicators", function(req, res) {
  res.sendfile("views/indicators.html");
});

// this adds the functionality to import data
// that is on a standard ZIP + CSV files.
router.get("/ingest", function(req, res) {
  res.sendfile("views/ingest.html");
});

// adding an ingestor
// NOTE: needs to be refactored.
router.route('/api/ingest').get(function(req, res) {

  // utils + variables
  var DOWNLOAD_DIR = '/ingest/';
  var download_url = String(req.param("file"));

  // function to store the file in a mongodb db
  function storeIndicator(file_name) {
    // function to parse local csv files into JSON objects here
    console.log('storing file')
    var store = fs.createReadStream(__dirname + DOWNLOAD_DIR + file_name)
      .pipe(parsecsv())
      .on('data', function(data) {
        console.log('Storing ' + data.indID);
        //mongoose.model('indicators').insert(data);
        var indicator = new Indicator();
        indicator.indID = data.indID;
        indicator.name = data.name;
        indicator.unit = data.unit;
        indicator.save(function(err) {
          if (err) {
            res.json({
              success: false,
              message: err
            });
          }
          res.json({
            success: true,
            message: 'Indicators created successfully!'
          });
        });
      });
  };

  // function to store the file in a mongodb db
  function storeDataset(file_name) {
    // function to parse local csv files into JSON objects here
    console.log('storing file')
    var store = fs.createReadStream(__dirname + DOWNLOAD_DIR + file_name)
      .pipe(parsecsv())
      .on('data', function(data) {
        console.log('Storing ' + data.dsID);
        //mongoose.model('indicators').insert(data);
        var dataset = new Source();
        dataset.dsID = data.dsID;
        dataset.name = data.name;
        dataset.last_updated = data.last_updated;
        dataset.last_scraped = data.last_scraped;
        dataset.save(function(err) {
          if (err)
            res.send(err);
          res.json({
            message: 'Dataset created successfully!'
          });
        });
      });
  };

  // function to store the file in a mongodb db
  function storeValue(file_name) {
    // function to parse local csv files into JSON objects here
    console.log('storing file')
    var store = fs.createReadStream(__dirname + DOWNLOAD_DIR + file_name)
      .pipe(parsecsv())
      .on('data', function(data) {
        console.log('Storing ...');
        //mongoose.model('indicators').insert(data);
        var value = new Value();
        value.dsID = data.dsID;
        value.region = data.region;
        value.indID = data.indID;
        value.timeReference = data.timeReference;
        value.value = data.value;
        value.is_number = data.is_number;
        value.source = data.source;
        value.save(function(err) {
          if (err)
            res.send(err);
          res.json({
            message: 'Values created successfully!'
          });
        });
      });
  };

  function uncompressFile(file) {
    // reading archives
    console.log('uncompressing');
    fs.createReadStream(__dirname + DOWNLOAD_DIR + file)
      .pipe(unzip.Extract({
        path: __dirname + DOWNLOAD_DIR
      }))
      .on('close', function(csv_name) {
        console.log('Successfully extracted the files'); // this part isn't working
        var csv_indicator = 'data/indicator.csv';
        var csv_dataset = 'data/dataset.csv';
        var csv_value = 'data/value.csv';
        storeIndicator(csv_indicator);
        storeDataset(csv_dataset);
        storeValue(csv_value);
      });
  };

  function downloadFile(file_url, callback) {
    console.log('downloading file');

    // create db logging middleware
    console.log('This is the URL being fetched:', file_url);

    var file_name = url.parse(file_url).pathname.split('/').pop();
    var file = fs.createWriteStream(__dirname + DOWNLOAD_DIR + file_name);

    var options = {
      host: url.parse(file_url).host,
      port: 80,
      path: url.parse(file_url).pathname
    };

    http.get(options, function(res) {
      res.on('data', function(data) {
        file.write(data);
      }).on('end', function() {
        file.end();
        console.log(file_name + ' successfully downloaded to ' + DOWNLOAD_DIR);
        uncompressFile(file_name);
      });
    });
  };

  // triggering functions
  downloadFile(download_url);

});

// ADDING API ROUTES
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// load from config.json
// QUESTION: how to load local json file with server.js (config.json)
router.get('/api', function(req, res) {
  res.json({
    help: "Prototype of an analytical API for the analysis of high frequency humanitarian information.",
    version_name: config.version_name,
    version: config.version,
    repository: 'https://github.com/luiscape/xanadu-app',
    base_query: {
      locations: "api/locations"
    }
  });
});

// metadata for locations
router.route('/api/locations/adm0')
  .get(
    function(req, res) {
      Locations.count({
          'properties.ADM0_CODE': {
            $exists: true
          },
          'properties.ADM1_CODE': {
            $exists: false
          }
        },
        function(err, total) {
          Locations.find({
              'properties.ADM0_CODE': {
                $exists: true
              },
              'properties.ADM1_CODE': {
                $exists: false
              }
            }, {
              'properties.ADM0_CODE': 1,
              'properties.ADM0_NAME': 1
            },
            function(err, values) {
              if (err) console.log("You've got an error counting my friend");
              else res.json({
                success: true,
                help: "Returning the metadata for the Admin 0 administrative boundaries.",
                count: total,
                locations: values
              });
            });

        });
    });


// debugging locations
router.route('/api/locations').get(
  function(req, res) {
    Locations.count({}, function(err, total) {
      if (err) console.log("You've got an error counting my friend");


      if (req.param("ADM0_CODE") && req.param("ADM1_CODE") && req.param("ADM2_CODE")) {
        Locations.find({
          'properties.ADM0_CODE': req.param("ADM0_CODE"),
          'properties.ADM1_CODE': req.param("ADM1_CODE"),
          'properties.ADM2_CODE': req.param("ADM2_CODE")
        }, function(err, values) {
          Locations.count({
            'properties.ADM0_CODE': req.param("ADM0_CODE"),
            'properties.ADM1_CODE': req.param("ADM1_CODE"),
            'properties.ADM2_CODE': req.param("ADM2_CODE")
          }, function(err, total) {;
            if (err) console.log("You've got an error counting my friend");
            else res.json({
              help: "Queried location",
              count: total,
              locations: values
            });
          });
        });
      } else if (req.param("ADM0_CODE") && req.param("ADM1_CODE")) {
        Locations.find({
          'properties.ADM0_CODE': req.param("ADM0_CODE"),
          'properties.ADM1_CODE': req.param("ADM1_CODE"),
          'properties.ADM2_CODE': {
            $exists: false
          }
        }, function(err, values) {
          Locations.count({
            'properties.ADM0_CODE': req.param("ADM0_CODE"),
            'properties.ADM1_CODE': req.param("ADM1_CODE"),
            'properties.ADM2_CODE': {
              $exists: false
            }
          }, function(err, total) {;
            if (err) console.log("You've got an error counting my friend");
            else res.json({
              help: "Queried location",
              count: total,
              locations: values
            });
          });
        });
      } else if (req.param("ADM2_CODE")) {
        Locations.find({
          'properties.ADM2_CODE': req.param("ADM2_CODE")
        }, function(err, values) {
          Locations.count({
            'properties.ADM2_CODE': req.param("ADM2_CODE")
          }, function(err, total) {;
            if (err) console.log("You've got an error counting my friend");
            else res.json({
              success: true,
              help: "Queried location",
              count: total,
              locations: values
            });
          });
        });
      } else if (req.param("ADM1_CODE")) {
        Locations.find({
          'properties.ADM0_CODE': req.param("ADM0_CODE"),
          'properties.ADM1_CODE': {
            $exists: false
          },
          'properties.ADM2_CODE': {
            $exists: false
          }
        }, function(err, values) {
          Locations.count({
            'properties.ADM0_CODE': req.param("ADM0_CODE"),
            'properties.ADM1_CODE': {
              $exists: false
            },
            'properties.ADM2_CODE': {
              $exists: false
            }
          }, function(err, total) {;
            if (err) console.log("You've got an error counting my friend");
            else res.json({
              success: true,
              help: "Queried location",
              count: total,
              locations: values
            });
          });
        });
      } else if (req.param("ADM0_CODE")) {
        Locations.find({
          'properties.ADM0_CODE': req.param("ADM0_CODE"),
          'properties.ADM1_CODE': {
            $exists: false
          },
          'properties.ADM2_CODE': {
            $exists: false
          }
        }, function(err, values) {
          Locations.count({
            'properties.ADM0_CODE': req.param("ADM0_CODE"),
            'properties.ADM1_CODE': {
              $exists: false
            },
            'properties.ADM2_CODE': {
              $exists: false
            }
          }, function(err, total) {;
            if (err) console.log("You've got an error counting my friend");
            else res.json({
              success: true,
              help: "Queried location",
              count: total,
              locations: values
            });
          });
        });
      } else res.json({
        help: "Result of entities found.",
        count: total
      });
    });
  });

// =================== //
// REGISTER OUR ROUTES //
// =================== //
// All routes will be prefixed with `/api`
app.use('/', router);

// ================ //
// START THE SERVER //
// ================ //
app.listen(port, server_ip_address, function() {

  // General server information
  version = config.version;
  version_name = config.version_name;
  github = config.github;
  console.log('\n');
  console.log(chalk.blue.underline.bold('SERVER INFORMATION:'));
  console.log(chalk.yellow('Version: ') + version + " " + chalk.red(version_name));
  console.log(chalk.yellow('GitHub URL: ') + config.github);
  console.log(chalk.yellow('Author: ') + chalk.green(config.author));
  console.log(chalk.yellow('MongoDB connection: ') + mongodb_connection_string);
  // console.log(chalk.tellow('Connection: ') + );
  console.log(chalk.yellow('Port: ') + port);

  // Start logging below
  console.log('\n');
  console.log(chalk.red.underline.bold('LOG:'));
});
