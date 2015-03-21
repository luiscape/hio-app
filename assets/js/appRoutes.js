	angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

	$routeProvider

		// home page
		.when('/', {
			templateUrl: 'views/home.html',
			controller: 'MainController'
		})

		// nerds page that will use the NerdController
		.when('/x', {
			templateUrl: 'views/nerd.html',
			controller: 'NerdController'
		})

		//
		.when('/datasets', {
			templateUrl: 'views/geek.html',
			controller: 'GeekController'
		});

	$locationProvider.html5Mode(true);

}]);