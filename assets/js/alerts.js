// script to manage the alert system
// at the top of the page of the Ebola API

// function for checking if string is null, empty, or undefined
// from: http://stackoverflow.com/questions/154059/how-do-you-check-for-an-empty-string-in-javascript
function isEmpty(str) {
    return (!str || 0 === str.length);
}

// function to display system alerts
function displayAlert(alertType, alertMessage) {
  // defining the two variables used
  var alertMessage, alertType;

  // control for alert type to html
  // 0 = simple (green)
  // 1 = mild (yellow)
  // 2 = severe (red)
  if (alertType && alertMessage) {
  	colors = ['green', 'yellow', 'red'];
  	alertColor = colors[alertType];
  	if (alertType == 0) {
  		alertIcon = '<span class="fa fa-check"></span>';
  	}
  	else {
  		alertIcon = '<span class="fa fa-warning"></span>';
  	}
  	alertContainer = alertIcon + '<span ' + 'style="color:' + alertColor + ';">' +
  	                 '<span href="#">' + alertMessage + '</span>' + '</span>';

  	// pulse only for the mild and severe alerts
    if (alertType == 1 | alertType == 2) {
       pulse = '<div class="outer"></div>';
       var pulseDoc = document.getElementById('alert-container');
       pulseDoc.innerHTML = pulse;
    }
  }
  else {
  	alertContainer = '<span class="fa fa-warning"></span>' +
  	                 '<span ' + 'style="color:' + 'grey' + '">' +
  	                 'unavailable' + '</span>';
  }

  var doc = document.getElementById('statusAlert');
  doc.innerHTML = alertContainer;
};

// function to show the latest update time
function displayUpdate(date) {
	date = new Date(); // example

	// using a d3 date parser
	var format = d3.time.format("%B %d");

    // if empty write
	if (isEmpty(date)) {
		date = 'unavailable';
	}

    // html elements
	updatedContainer = '<span class="fa fa-refresh"></span>' +
				       '<span>Last updated on ' + '<a href="#">' +
				       format(date) + '</a>' + '</span>';
	var doc = document.getElementById('statusUpdate');
	doc.innerHTML = updatedContainer;
};

// trigger functions
displayAlert('0', 'everything ok');
displayUpdate();