'use strict';

/* Controllers */

angular.module('myApp.VideoPlayer', []).
  controller('videoPlayerCtrl', [function() {

  }])
  
  .directive('controlBar', function() {
  	return {
  		restrict: 'E',
  		templateUrl: 'partials/control-bar.html'
    };
  });