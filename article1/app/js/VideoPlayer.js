'use strict';

/* Controllers */

angular.module('myApp.VideoPlayer', []).
  controller('videoPlayerCtrl', ['$scope', '$rootScope', function(scope, rootScope) {
  	scope.playState = 'paused';
  	
  	scope.onPlayPause = function() {
  		if(scope.playState === 'pause') {
        scope.playState = 'playing' ;
      } else {
        scope.playState = 'pause';
      }
      rootScope.$broadcast('playStateChanged', scope.playState);
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
        var player = element[0];

  			scope.$on( 'playStateChanged', function(event, data) {
          if(data === 'pause') {
            player.play();
          } else {
            player.pause();
          }
				});
  		}
    };
  })