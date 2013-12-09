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
		expect(scope.playState).toBe('playing');
	});

	it(' onPlayPause sets playState to paused', function() {
		scope.$apply(function(){
			scope.playState = 'playing';
		});
		scope.onPlayPause();
		expect(scope.playState).toBe('paused');
	});

	it(' onPlayPause dispatches playing state', function() {
		spyOn(rootScope, '$broadcast');
		scope.onPlayPause();
		expect(rootScope.$broadcast).toHaveBeenCalledWith('playStateEvent', 'playing');
	});

	it(' onPlayPause dispatches playing state', function() {
		scope.$apply(function(){
			scope.playState = 'playing';
		});
		spyOn(rootScope, '$broadcast');
		scope.onPlayPause();
		expect(rootScope.$broadcast).toHaveBeenCalledWith('playStateEvent', 'paused');
	});

  });
});
