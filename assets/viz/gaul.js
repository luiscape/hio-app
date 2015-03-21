drawGaulBoundary = function(ADM0_CODE, ADM1_CODE, ADM2_CODE) {

    var gaul_path = "api/locations?ADM0_CODE=" + ADM0_CODE;

    // This is left outside because d3.json is asyncrhonous.
    // If we leave these parameters outside, the page will load
    // them and then load the SVG. Otherwise, the geometry will only
    // be loaded after d3.json is ready, possibly causing 'page reflow'.
    var width = 800,
        height = 800;

    // Create a projection object. Among its attributes:
    // a type of projection (`mercator`), a scale, the center point,
    // size (i.e. translation).
    var projection = d3.geo.mercator()
        .scale(5000)
        .center([0, 0])
        .translate([width / 2, height / 2]);

    // Create the SVG and determine its area.
    // Before creating a new map, delete the previous.
    var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a path generator.
    var path = d3.geo.path()
        .projection(projection);

    queue()
        .defer(d3.json, gaul_path)
        .await(makeMap);

    function makeMap(error, json) {
        if (error)
            console.log(error);

        var svg = d3.select("svg");
        var loc = json.locations[0];
        console.log(loc);

        // Compute the bounds of a feature of interest, then derive scale & translate.
        var b = d3.geo.bounds(loc),
            s = .9 / Math.max(Math.abs(b[1][0] - b[0][0]) / width, (Math.abs(b[1][1] - b[0][1]) / height)),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];


        var c = d3.geo.centroid(loc); // calculating the centroid. the output is long,lat.
        projection
        // .scale(s)
            .center(c);
        // .translate(t);

        // Adding
        svg.append("path")
            .datum(loc)
            .attr("d", path)
            .attr("class", "boundary");

        // Debuging
        console.log("Bounds: " + b);
        console.log("Scale: " + s);
        console.log("Transform: " + t);
        console.log("Centroid: " + c[1] + "," + c[0]);


        var svg = d3.select("svg"),
            svgWidth = svg.attr("width"),
            svgHeight = svg.attr("height");

        var paths = svg.selectAll("path")
            .call(transition);

        function transition(path) {
            path.transition()
                .duration(5000)
                .attrTween("stroke-dasharray", tweenDash)
                // .each("end", function() { d3.select(this).call(transition); }); // infinite loop
        }

        function tweenDash() {
            var l = this.getTotalLength(),
                i = d3.interpolateString("0," + l, l + "," + l); // interpolation of stroke-dasharray attr
            return function(t) {
                return i(t);
            };
        }

      // Make country name appear.
      var entity_name = json.locations[0].properties.ADM0_NAME;
      $('#entity-name').html(entity_name);
      $('#entity-name').addClass('animated fadeInDown');
    };

};

function animateBoundaries() {
    var svg = d3.select("svg"),
        svgWidth = svg.attr("width"),
        svgHeight = svg.attr("height");

    var paths = svg.selectAll("path")
        .call(transition);

    function transition(path) {
        path.transition()
            .duration(5000)
            .attrTween("stroke-dasharray", tweenDash)
            // .each("end", function() { d3.select(this).call(transition); }); // infinite loop
    }

    function tweenDash() {
        var l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l); // interpolation of stroke-dasharray attr
        return function(t) {
            return i(t);
        };
    }
};
