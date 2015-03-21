// app/models/indicators.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var indicatorsSchema   = new Schema({
	listID: String,
	indID: String,
	indName: String,
	description: String,
	sourceID: String,
	primaryTopicID: String,
	topics: String,
	periodicity: String,
	start: String,
	end: String,
	unit: String,
	scale: String,
	methodology: String,
	name: String,
	op: String
});

module.exports = mongoose.model('indicators', indicatorsSchema);