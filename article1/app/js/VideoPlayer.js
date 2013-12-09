'use strict';

/* Controllers */

angular.module('myApp.VideoPlayer', []).
  controller('videoPlayerCtrl', ['$scope', '$rootScope', function(scope, rootScope) {

    scope.PLAYING = "playing";
    scope.PAUSED = "paused";
    scope.PLAY_STATE_EVENT = "event::playStateChanged";

  	scope.playState = scope.PAUSED;
  	
  	scope.onPlayPause = function() {
  		if(scope.playState === scope.PAUSED) {
        scope.playState = scope.PLAYING;
      } else {
        scope.playState = scope.PAUSED;
      }
      rootScope.$broadcast(scope.PLAY_STATE_EVENT, scope.playState);
  	}
  }])  
  .directive('controlBar', function() {
  	return {
  		restrict: 'E',
  		replace: true,
  		templateUrl: 'partials/control-bar.tpl.html',
  		link: function(scope, element, attrs) {

  		}
    };	
  })
  .directive('videoPlayer', function() {
  	return {
  		restrict: 'E',
  		replace: true,
  		controller: 'videoPlayerCtrl',
  		templateUrl: 'partials/video.tpl.html',
  		link: function(scope, element, attrs) {
        var player = element[0];

  			scope.$on( scope.PLAY_STATE_EVENT, function(event, data) {
          if(data === scope.PLAYING) {
            player.play();
          } else {
            player.pause();
          }
				});
  		}
    };
  })