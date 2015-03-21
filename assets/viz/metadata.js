// Getting the location list

function fetchGeoMetadata(adm_level) {
	var meta_url = 'http://localhost:8000/api/locations/adm' + adm_level;
	d3.json(meta_url, function(error, json) {
		if (error) {
			console.log("An error occured when fetching metadata.")
			console.log(err)
			}
		else {
			document.getElementById("boundary-count").innerHTML = json["count"];

			var locations = new DataCollection(json["locations"]);
    		values = locations.query().values("properties");

    		for (i = 0; i < values.length; i++) {
    			var doc = '<option value="' + values[i]["ADM0_CODE"] + '">' + values[i]["ADM0_NAME"] + "</option>";
    			document.getElementById("adm_codes_input").innerHTML += doc;
    		};
		};
	});
};

fetchGeoMetadata(0);