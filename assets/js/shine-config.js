// applying a shadow effect to the name
// of the API

// use new shinejs.Shine(...) if Shine is already defined somewhere else
// var shine = new shinejs.Shine(document.getElementById('headline'));
var shine = new Shine(document.getElementById('shineThis'));

function handleMouseMove(event) {
  shine.light.position.x = event.clientX;
  shine.light.position.y = event.clientY;
  shine.draw();
}

window.addEventListener('mousemove', handleMouseMove, false);