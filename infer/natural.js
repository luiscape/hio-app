// natural.js uses a Naive Bayes classifier
// to "understand" the queries made so that
// the application can answer effectivelly.
// Xanadu has to be able to continuously
// provide contextually-relevant information
// about a crisis in quesion.

var natural = require('natural'),
  classifier = new natural.BayesClassifier();


// for logging the results of the classification
// classifier.events.on('trainedWithDocument', function (obj) {
//    console.log(obj);
// });

// classifier.addDocument('the refugees in syria are in need', 'refugee');
// classifier.addDocument('help the syrian idps', 'refugee');
// classifier.addDocument('funding for humanitarian emergencies is needed', 'finance');
// classifier.addDocument('donate to the syrian cause', 'finance');
// classifier.addDocument('syrian refugees are in need of a lot of money', 'finance');

// classifier.train();

natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
    // console.log(classifier.classify('how much money do they need?'));
	console.log(classifier.getClassifications('how many refugees are in Syria today?'));
});


// classifier.save('classifier.json', function(err, classifier) {
//     // the classifier is saved to the classifier.json file!
// });