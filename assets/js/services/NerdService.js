angular.module('NerdService', []).factory('Nerd', ['$http', function($http) {

	return {
		// call to get all nerds
		get : function() {
			return $http.get('/api/indicators');
		}
	}

}]);