'use strict';

/* jasmine specs for controllers go here */

describe('Video Player', function(){
  beforeEach(module('myApp.VideoPlayer'));

  describe(' controller', function(){
  	var scope;
  	var rootScope;
  	beforeEach( 
			function() {
				inject(['$rootScope', '$controller', function($rootScope, $controller) {
					scope = $rootScope.$new();
					rootScope = $rootScope;
					$controller('videoPlayerCtrl', {$scope: scope, $rootScope: rootScope});
				}]);
			}
		);

	it(' onPlayPause sets playState to playing', function() {
		scope.onPlayPause();
		expect(scope.playState).toBe(scope.PLAYING);
	});	

	it(' onPlayPause sets playState to paused', function() {
		scope.$apply(function(){
			scope.playState = scope.PLAYING;
		});
		scope.onPlayPause();
		expect(scope.playState).toBe(scope.PAUSED);
	});

	it(' onPlayPause dispatches playing state', function() {
		spyOn(rootScope, '$broadcast');
		scope.onPlayPause();
		expect(rootScope.$broadcast).toHaveBeenCalledWith(scope.PLAY_STATE_EVENT, scope.PLAYING);
	});

	it(' onPlayPause dispatches playing state', function() {
		scope.$apply(function(){
			scope.playState = scope.PLAYING;
		});
		spyOn(rootScope, '$broadcast');
		scope.onPlayPause();
		expect(rootScope.$broadcast).toHaveBeenCalledWith(scope.PLAY_STATE_EVENT, scope.PAUSED);
	});

  });

  describe(' directive', function(){

  	beforeEach(module('partials/video.tpl.html'));

  	var rootScope;
  	var scope;
	var elm;
		
	beforeEach( 
		inject(['$rootScope', '$compile', function($rootScope, $compile) {
			
			scope = $rootScope.$new();
			rootScope = $rootScope;
			elm = '<video-player></video-player>';
		    elm = $compile(elm)(scope);
		    scope.$digest();
		}])
	);

	it(' on PLAY_STATE_EVENT == playing, the video should play', function() {
		var video = elm[0];
		spyOn(video, 'pause');
		spyOn(video, 'play');
		rootScope.$broadcast('event::playStateChanged', scope.PLAYING);
		
		expect(video.play).toHaveBeenCalled();
		expect(video.pause).not.toHaveBeenCalled();
	});

	it(' on PLAY_STATE_EVENT == paused, the video should pause', function() {
		var video = elm[0];
		spyOn(video, 'pause');
		spyOn(video, 'play');
		rootScope.$broadcast('event::playStateChanged', scope.PAUSED);
		expect(video.pause).toHaveBeenCalled();
		expect(video.play).not.toHaveBeenCalled();
	});

  });
});
