#!/bin/env node

// Loading dependencies.
// Note: many libraries are merely experimental.
// The ones maked with '*' are the essential ones for
// the proper working of the application.
var express    = require('express'); 		// (*) call express
var app        = express(); 				// (*) define our app using express
var bodyParser = require('body-parser');
var chalk      = require('chalk');               // for printing colorful logs
var fs         = require('fs');
var url        = require('url');
var request    = require('request');
var path       = require('path');
var Zip        = require('adm-zip');
var unzip      = require('unzip');
var http       = require('http');
var exec       = require('child_process').exec;
var spawn      = require('child_process').spawn;
var methodOverride = require('method-override');
var parsecsv   = require('csv-parser');
var mongoose   = require('mongoose');
var cors       = require('cors');
// var async      = require('async');
// var mongoosastic = require('mongoosastic');     // experiment with elasticsearch

// updating extress-specific configuration
// these will parse the HTTP requests
// and help define the GET and POST functions

app.use(bodyParser());
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(require('morgan')('dev')); // for logging
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
app.use(cors()); // Allowing CORS

// this serves the static content of the app
// namelly css, js, and img files
app.use(express.static(path.join(__dirname, 'assets')));

// configuration for the port to use.
// the first uses a local port. the second
// uses a openshift environment variable
// to determine what port to use.
var port = process.env.PORT || 8080;  // for local
if(process.env.OPENSHIFT_NODEJS_PORT) {  // for remote
	var port = process.env.OPENSHIFT_NODEJS_PORT || 8080
	var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
}

// database connections.
// the first variables determine the
// local parameters to use.
var db_name = 'xanadu';
mongodb_connection_string = 'mongodb://127.0.0.1:27017/' + db_name;

// the second determine what paramenters
// to use when deployed to openshift.
// it uses a series of global variables
// specific to openshift.
if(process.env.OPENSHIFT_MONGODB_DB_HOST){
  mongodb_connection_string = 'mongodb://' +
  process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT) + '/' +
  db_name;
}

// effectivelly connecting to mongodb
// improve function:
// - log errors
// - log successes
connectToDb = function() {
	mongoose.connect(mongodb_connection_string);
	var connection = mongoose.connection;
	return(connection)
};

var conn = connectToDb();

// loading the shema models for the
// different collections in the database
var Indicator  = require('./models/indicators');
var Value      = require('./models/values');
var Source     = require('./models/sources');
var Locations  = require('./models/locations');


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
  // typically we might sanity check that user_id is of the right format
  Value.find(region, function(err, user) {
    if (err) return next(err);

    req.region = region;
    next();
  });
});

// ADDING UI VIEWS
router.get("/", function(req, res) {
  res.sendfile("views/index.html");
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
			  if (err)
				  res.send(err);
              res.json({ message: 'Indicators created successfully!' });
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
              res.json({ message: 'Dataset created successfully!' });
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
              res.json({ message: 'Values created successfully!' });
	      });
	    });
	  };

      function uncompressFile(file) {
	  	// reading archives
	  	console.log('uncompressing');
	    fs.createReadStream(__dirname + DOWNLOAD_DIR + file)
	      .pipe(unzip.Extract({ path: __dirname + DOWNLOAD_DIR }))
	      .on('close', function(csv_name) {
              console.log('Successfully extracted the files');  // this part isn't working
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
router.get('/api', function(req, res) {
	res.json({
		help: "Prototype of an analytical API for the analysis of high frequency humanitarian information.",
		version_name: 'Liberia',
		version: 0.1,
		repository: 'https://github.com/luiscape/xanadu-app',
		base_query: {
			indicators: 'http://gaza-hdxapi.rhcloud.com/api/indicators',
			values: 'http://gaza-hdxapi.rhcloud.com/api/values',
			datasets: 'http://gaza-hdxapi.rhcloud.com/api/datasets',
			locations: 'http://gaza-hdxapi.rhcloud.com/api/locations',
		}
	});
});

// indicators routes
router.route('/api/indicators')
    .get(function(req, res) {
		Indicator.find(function(err, indicators) {
			if (err)
				res.send(err);

			if (req.param("indID")) {
				mongoose.model('indicators').find({ indID: req.param("indID") }, function(err, indicators) {
					Indicator.count({ indID: req.param("indID") }, function (err, total) {
					  if (err) console.log("you've got an error counting my friend");
					  else res.json({ count: total, result: indicators });
	      			});
				});
			}
			else if (req.param("unit")) {
				mongoose.model('indicators').find({ unit: req.param("unit") }, function(err, indicators) {
	      			Indicator.count({ unit: req.param("unit") }, function (err, total) {
					  if (err) console.log("you've got an error counting my friend");
					  else res.json({ count: total, result: indicators });
	      			});
	      		});
			}

			else if (req.param("op")) {
				mongoose.model('indicators').find({ op: req.param("op") }, function(err, indicators) {
	      			Indicator.count({ op: req.param("op") }, function (err, total) {
					  if (err) console.log("you've got an error counting my friend");
					  else res.json({
					  	count: total,
					  	warning: "Operational indicators are are crisis-specific indicators. They are relevant to the context of operations, but their quality should be generally considered inferior to the indicators present in the CHD list. Pleas use with care.",
					  	result: indicators
					  });
	      			});
	      		});
			}

			else {
				Indicator.count({ }, function (err, total) {
				  if (err) console.log("you've got an error counting my friend");
				  else res.json({
				  	help: "List of indicators available in CPS. The indicators available in CPS are curated by HDX's Data Team", 
				  	count: total,
				  	result: indicators
				  });
				});
			}
		});
	})
	// create an indicator (accessed at POST /api/indicator)
	.post(function(req, res) {
		var indicator = new Indicator(); 		// create a new instance of the Bear model
		// indicator.name = req.body.name;  // set the indicator name (comes from the request)

		// save the indicator and check for errors
		indicator.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Indicator created!' });
		});
	});


// searching values based on indIDs
router.route('/api/values').get(function(req, res) {
	var result_message = 'Query result.';
		Value.find(function(err, values) {
			if (err)
				res.json({ error: err });

			// for queryign indID + ADM0_CODE + timeReference
			if (req.param("indID") && req.param("ADM0_CODE") && req.param("timeReference")) {
	      		Value.find({
	      			indID: req.param("indID"),
	      			region: req.param("region"),
	      			timeReference: req.param("timeReference")}, function(err, values) {
						res.json({
							help: result_message,
							count: "null",
							values: values
						});
				});
			}

			else if (req.param("indID") && req.param("ADM0_CODE")) {
	      		Value.find({
		      			indID: req.param("indID"),
		      			ADM0_CODE: req.param("ADM0_CODE")
		      		}, function(err, values) {
						res.json({
							help: result_message,
							count: "null",
							result: values
						});
				});
			}

			else if (req.param("indID") && req.param("timeReference")) {
	      		mongoose.model('values').find({
	      			indID: req.param("indID"),
	      			region: req.param("region")}, function(err, values) {
					res.json({
						help: 'Use this section to query the indicator values from HDX',
						values: values
					});
				});
			}

			else if (req.param("indID") && req.param("timeReference")) {
	      		mongoose.model('values').find({
	      			indID: req.param("indID"),
	      			timeReference: req.param("timeReference")}, function(err, values) {
					res.json({
						help: 'Use this section to query the indicator values from HDX',
						result: values
					});
				});
			}

			else if (req.param("indID")) {
				mongoose.model('values').find({ indID: req.param("indID") }, function(err, indicators) {
					mongoose.model('values').count({ indID: req.param("indID") }, function (err, total) {
					  if (err) console.log("you've got an error counting my friend");
					  else res.json({
					  	count: total,
					  	result: indicators
					  });
	      			});
				});
			}

			else if (req.param("region")) {
				mongoose.model('values').find({ region: req.param("region") }, function(err, values) {
	      			res.json({
	      				help: result_message,
	      				result: values
	      			});
				});
			}

			else if (req.param("timeReference")) {
				mongoose.model('values').find({ timeReference: req.param("timeReference") }, function(err, values) {
	      			res.json({
	      				help: 'Use this section to query the indicator values from HDX',
	      				values: result
	      			});
				});
			}

			else res.json( { help: 'Select at least one indicator.', indID: values } );

		});
	});

// datasets general route
router.route('/api/sources')
	.get(function(req, res) {
		Source.find(function(err, sources) {
			if (err)
				res.send(err);

			res.json(sources);
		});
	});

// locations general route
router.route('/api/locations')
	.get(function(req, res) {
		var result_message = "Query result."
		Locations.find(function(err, locations) {
			if (err)
				res.send(err);

			if (req.param("ADM0_CODE")) {
				Locations.find({ 'properties.ADM0_CODE': req.param("ADM0_CODE") }, function(err, values) {
					Locations.count({ 'properties.ADM0_CODE': req.param("ADM0_CODE") }, function (err, total) {
							if (err) console.log("You've got an error counting my friend");
							else res.json({
							 help: result_message,
							 count: total,
							 locations: values,
							});
				});
			  });
			}

			else if (req.param("locTypeID")) {
				mongoose.model('gaul').find({ locTypeID: req.param("locTypeID") }, function(err, values) {
					Locations.count({ locTypeID: req.param("locTypeID") }, function (err, total) {
					  if (err) console.log("you've got an error counting my friend");
					  else res.json({
					  	help: result_message,
					  	count: total,
					  	locations: values
					  });
					})
				});
			}

			else {
				Locations.count({ } , function (err, total) {
				  if (err) console.log("you've got an error counting my friend");
				  else res.json({ count: total, locations: locations });
				});
			};
		});
	});



// debugging locations
router.route('/api/locations').get()


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);  // for local

// START THE SERVER
// =============================================================================
app.listen(port, server_ip_address, function () {
	// parameters that print helpful
	// server information.
	version = 0.1;
	version_name = '"Liberia"';
	github = 'none';
	console.log('\n');
	console.log(chalk.blue.underline.bold('SERVER INFORMATION:'));
	console.log(chalk.yellow('Version: ') + version + " " + chalk.red(version_name));
	console.log(chalk.yellow('GitHub URL: ') + github);
	console.log(chalk.yellow('Author: ') + chalk.green(' @luiscape.'));
	console.log(chalk.yellow('MongoDB connection: ') + mongodb_connection_string);
	// console.log(chalk.tellow('Connection: ') + );
	console.log(chalk.yellow('Port: ') + port);

	// start the logging
	console.log('\n');
	console.log(chalk.red.underline.bold('LOG:'));
});