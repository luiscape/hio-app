// app/models/indicators.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var sourcesSchema   = new Schema({
		dsID: String,
		last_updated: String,
	    last_scraped: String,
		name: String
	}
);

// change the collection name to `sources` from `datasets` in the DB.
module.exports = mongoose.model('datasets', sourcesSchema);