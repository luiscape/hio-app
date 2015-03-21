angular.module('GeekService', []).factory('Geek', ['$http', function($http) {

	return {
		// call to get all nerds
		get : function() {
			return $http.get('/api/datasets');
		}
	}
}]);
