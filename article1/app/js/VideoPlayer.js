'use strict';

/* Controllers */

angular.module('myApp.VideoPlayer', []).
  controller('videoPlayerCtrl', ['$scope', function(scope, model) {
  	scope.playState = 'paused';
  	scope.muteState = 'volumeState';
  	
  	// scope.onPlayPause = function( event ) {
  	// 	scope.$broadcast('playing');
  	// }

  	scope.durationChange = function(event) {
  		console.log("playstate handler");
  	}
  }])  
  .directive('controlBar', function() {
  	return {
  		restrict: 'E',
  		replace: true,
  		templateUrl: 'partials/control-bar.html',
  		link: function(scope, element, attrs) {
  		}
    };	
  })
  .directive('videoPlayer', function() {
  	return {
  		restrict: 'E',
  		replace: true,
  		controller: 'videoPlayerCtrl',
  		templateUrl: 'partials/video.html',
  		link: function(scope, element, attrs) {
  			element.bind( 'progress', function(){
  				console.log('woot');
  			});

  			scope.onPlayPause = function(){
  									element[0].play();
  								};
  		}
    };
  })