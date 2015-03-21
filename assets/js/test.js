// test.js
(function(){
	d3.json('http://localhost:8080/api/locations?ADM0_CODE=230', function(err, json) {
		if (err) console.log(err)
		else console.log(json);
	});
})();
