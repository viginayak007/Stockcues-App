// declare modules

var app = angular.module('Stock-Cues', [
    'ngRoute',
    'ngCookies',
    'ngSanitize',
    'googlechart',
    'ui.bootstrap',
])

//config route
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/login', {
            controller: 'loginController',
            templateUrl: 'views/Login/login.html'
        })
        .when('/', {
            controller: 'mainController',
            templateUrl: 'views/Main/main.html'
        })
        .otherwise({
            redirectTo: '/login'
        });

    $locationProvider.html5Mode(true);

}]);

// configure our run
app.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http, $locationProvider) {

    // $rootScope.apiUrl = "http://localhost:16557";

    // keep user logged in after page refresh
    $rootScope.globals = $cookieStore.get('globals') || {};

    // $rootScope.globals.currentUser ='Admin';

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        $rootScope.globals.code = $location.search().code;

        //check if the code and bring user detial from Upstox API 
        if (!$rootScope.globals.code) {
            $location.path('/login');
        }
    });

}]);