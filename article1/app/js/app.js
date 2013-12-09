'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.VideoPlayer'
]).
config(['$routeProvider', function($routeProvider) {
  // $routeProvider.when('/planning-poker', {templateUrl: 'partials/planning-poker.html', controller: 'planningPokerCtrl'});
  $routeProvider.when('/video-player', {templateUrl: 'partials/video-player.html', controller: 'videoPlayerCtrl'});
  $routeProvider.otherwise({redirectTo: '/video-player'});
}]);
