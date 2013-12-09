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
});
