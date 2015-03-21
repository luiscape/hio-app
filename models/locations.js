// app/models/locations.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

// var locationsSchema   = new Schema({
// 	locID: String,
// 	parent: String,
// 	locTypeID: String,
// 	name: String,
// 	description: String,
// 	pacode: String,
// 	geography: String,
// 	metadata: String
// });

var locationsSchema   = new Schema({
		'properties.STATUS': String,
		'properties.ADM0_CODE': Number,
		'properties.ADM0_NAME': String,
		'properties.ADM1_CODE': Number,
		'properties.ADM1_NAME': String,
		'properties.ADM2_CODE': Number,
		'properties.ADM2_NAME': String
	},
	{ collection: 'gaul' }
);

module.exports = mongoose.model('gaul', locationsSchema);