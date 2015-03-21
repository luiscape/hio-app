// app/models/indicators.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var valuesSchema   = new Schema({
	value: Number,
	indID: String,
	indName: String,
	locID: String,
	sourceID: String,
	timeReference: String
});

module.exports = mongoose.model('values', valuesSchema);