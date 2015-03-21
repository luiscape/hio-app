// Configuration for the particle
// effects on the background of
// index.html

$(document).ready(function() {
  $('#particles').particleground({
    dotColor: '#4D4D57',
    lineColor: '#4D4D57',
    directionX: 'center',
    particleRadius: 8.5,
    curvedLines: false,
    lineWidth: 1.3,
    density: 20000,
    // height: 400,
    proximity: 70
  });
});