'use strict';

angular.module('main', ['ngRoute', 'ngSanitize', 'ui', 'ui.bootstrap', 'googlechart', 'navbar-toggle'])
.constant('API_URL', 'http://secxbrl-info.alpha.xbrl.io/v1')
.constant('API_TOKEN', 'M1lrQjlCYzdoZnJFY1F3ek15ZnFzRzRLWWg0PToyMDEzLTEyLTEyVDEzOjMxOjI3LjQ4MzYzNVo=')
.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            templateUrl: '/views/home.html'
        })
        .when('/why', {
            templateUrl: '/views/why.html'
        })
        .when('/source', {
            templateUrl: '/views/source.html',
            controller: 'SourceCtrl'
        })
        .when('/source/:query', {
            templateUrl: '/views/source.html',
            controller: 'SourceCtrl'
        })
        .when('/analytics', {
            templateUrl: '/views/analytics.html',
            controller: 'AnalyticsCtrl'
        })
        .when('/analytics/:year/:period/:group', {
            templateUrl: '/views/analytics.html',
            controller: 'AnalyticsCtrl'
        })
        .when('/dashboard', {
            templateUrl: '/views/dashboard.html',
            controller: 'DashboardCtrl'
        })
        .when('/dashboard/:year/:period', {
            templateUrl: '/views/dashboard.html',
            controller: 'DashboardCtrl'
        })
        .when('/search', {
            templateUrl: '/views/search.html',
            controller: 'SearchCtrl'
        })
        .when('/search/:year/:period', {
            templateUrl: '/views/search.html',
            controller: 'SearchCtrl'
        })
        //404
        .otherwise({
            templateUrl:'/views/404.html'
        });
}])
.run(['$rootScope', '$http', 'API_URL',
    function($rootScope, $http, API_URL) {
        $rootScope.$on('$routeChangeSuccess', function(event, current) {
			$rootScope.page = current.loadedTemplateUrl;
        });

        $rootScope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

		$http({
				method: 'POST', 
				url: API_URL + '/_queries/public/FilerSectorList.jq'
			}).
			success(function(data, status, headers, config) {
				if (data && data.members){
					$rootScope[data.domain] =  [];
					data.members.forEach(function(item) {
						$rootScope[data.domain].push(item[data.domain]);
					});
					$rootScope.safeApply();
				}
			});

		$http({
				method: 'POST', 
				url: API_URL + '/_queries/public/GeneratorList.jq'
			}).
			success(function(data, status, headers, config) {
				if (data && data.members){
					$rootScope[data.domain] =  [];
					data.members.forEach(function(item) {
						$rootScope[data.domain].push(item[data.domain]);
					});
					$rootScope.safeApply();
				}
			});

		$http({
				method: 'POST', 
				url: API_URL + '/_queries/public/EntityTypeList.jq'
			}).
			success(function(data, status, headers, config) {
				if (data && data.members){
					$rootScope[data.domain] =  [];
					data.members.forEach(function(item) {
						$rootScope[data.domain].push(item[data.domain]);
					});
					$rootScope.safeApply();
				}
			});

		$http({
				method: 'POST', 
				url: API_URL + '/_queries/public/StockIndexList.jq'
			}).
			success(function(data, status, headers, config) {
				if (data && data.members){
					$rootScope[data.domain] =  [];
					data.members.forEach(function(item) {
						$rootScope[data.domain].push(item[data.domain]);
					});
					$rootScope.safeApply();
				}
			});

		$http({
				method: 'POST', 
				url: API_URL + '/_queries/public/EntityNameTickerCIKTuples.jq'
			}).
			success(function(data, status, headers, config) {
				if (data && data.entityNameTickerSymbolCikTuples){
					$rootScope.entities =  data.entityNameTickerSymbolCikTuples;
					$rootScope.safeApply();
				}
			});
    }
]);