/*! REPlayer - 
* version: 0.0.3 
* build:  
* rev:  
* 2014-03-03
* http://realeyes.com/replayer
* Copyright (c) 2014 RealEyes Media; Licensed RealEyes */
TimelineMarkerService = angular.module('iSP.TimelineMarker.services', [])
	.factory('TimelineMarkerService', ['$http', 'PlayerAPI', '$rootScope',
		function($http, PlayerAPI, $rootScope) {
			return function() {
				return {
					get: function(uri) {
						if( uri && uri !== '' ) {
							$.get(uri)
								.done(function(result) {
									resultAsJSON = xmltoJSON.parseXML(result);
									if (resultAsJSON.hasOwnProperty('Markers') && resultAsJSON.Markers.hasOwnProperty('MarkerCollection') && resultAsJSON.Markers.MarkerCollection.hasOwnProperty('Marker')) {
										var markersJSON = resultAsJSON.Markers.MarkerCollection.Marker;
										var markers = translateMarkersJSON(markersJSON);
	                  					// console.log('markers is ', markers);
	                  					PlayerAPI.setTimelineMarkers(markers);
									}
								})
								.fail(function(error) {
									console.log(error);
								});
							}
					}
				}
			}
		}
	])
	.factory('TimelineMarkerMediator', ['PlayerAPI', '$rootScope', '$window', '$timeout', 'TimelineMarkerService',

		function($scope, PlayerAPI, $rootScope, $timeout, markerSvc) {
			
			$scope.configuration = undefined;
			
			var TimelineMarkerMediator = function() {
				// console.log('TimelineMarkerMediator initialized');
				this.initialize();
			};

			TimelineMarkerMediator.prototype = $.extend(TimelineMarkerMediator.prototype, {

				timelineMarkersLoaded: false,

				SERVICE_CALL_COMPLETE: 'serviceCallComplete',

				initialize: function() {
					if (window.onMarkerServiceReady) {
						window.onMarkerServiceReady(this);
					}
				},

				configure: function(config) {
					$scope.configuration = config;
				},

				loadTimelineMarkers: function() {
          // console.log('loadTimelineMarkers fired');
					var self = this;
					var svc = new markerSvc();
					var promise = svc.get($scope.configuration.timelineMarkerDataSource);
          self.pollTimelineMarkers();

						/*promise.then(
							function(data) {
								$scope.configuration.markers = data.markers;
								self.pollTimelineMarkers;

								self.timelineMarkersLoaded = true;
								$(self).trigger(self.SERVICE_CALL_COMPLETE, {
									self: self
								}, true);
							},
							function(error) {
								self.pollTimelineMarkers;

								self.timelineMarkersLoaded = true;
								$(self).trigger(self.SERVICE_CALL_COMPLETE, {
									self: self
								}, true);
							});*/
				},

				pollTimelineMarkers: function() {
					// console.log('pollTimelineMarkers fired', $scope.configuration.timelineMarkerDataInterval);
					var self = this;
					$rootScope.timelineMarkerPoll = $timeout(function() {
						// console.debug('LOADING TIMELINE MARKERS - POLL: ' + $scope.configuration.timelineMarkerDataInterval);
						self.loadTimelineMarkers();
					}, ($scope.configuration.timelineMarkerDataInterval * 1000));
				}

				// onInitialServiceCallComplete: function( event, selfRef, success ) {
				//   var self = selfRef.self;
				//   //If all our initial services have loaded, go ahead and load the game data
				//   if( self.timelineMarkersLoaded ) {

				//     $( self ).unbind( self.SERVICE_CALL_COMPLETE, self.onInitialServiceCallComplete );
				//   }
				// },

			});
			return new TimelineMarkerMediator();
		}
	]);

	TimelineMarkerService.run(['TimelineMarkerMediator', function($markerMediator) {
	// console.log('We have a marker service: ', $markerMediator);
}]);

function translateMarkersJSON(markersJSON) {
	var markers = [];
	
	//If there is only one, it won't be an array, so make it one
	if (!markersJSON.length && markersJSON.Text) {
		markersJSON = [markersJSON];
	}

	for (var i = 0; i < markersJSON.length; i++) {
		markers.push({
			text: markersJSON[i].Text,
			time: markersJSON[i].Time
		});
	}
	
	return markers;
}
var REPlayer = angular.module('REPlayer', 
	[ 'ngRoute', 'ngSanitize', 'iSP.TimelineMarker.services', 'REPlayer.PlayerModule'])
	.config(['$routeProvider', '$locationProvider', '$httpProvider',  
	    function($routeProvider, $locationProvider, $httpProvider) {
			console.log('VERSION', version);

			//Using the route provider to pass in a template key based on route
			$routeProvider
				.when('/html', {template: 'htmlplayer'})
				.when('/flash', {template: 'flashplayer'})
				.when('/noplayback', {template: 'noplayback'})
				.otherwise({template: 'replayer'});
			
		}]);


//=== Controller ===
//Do not remove $route. It is needed to be able to listen to the routeChangeSuccess event
REPlayer.controller('REPlayerCtrl', 
					['$rootScope', '$scope', '$route', function( $rootScope, $scope, $route ) {

	$scope.playerTemplate = undefined;
	$scope.defaultTemplate = 'replayer';

	$rootScope.$on( '$routeChangeSuccess', function( event, current, previous, resolve ) {
		//If a non-default template was specified in the route, use that. Otherwise choose by capability
		if( current.template !== undefined && current.template !== $scope.defaultTemplate ) {
			$scope.playerTemplate = current.template;
		}
		else
		{
			$rootScope.hasFlash = false;
			if( swfobject.hasFlashPlayerVersion('11.2') ){
				$rootScope.hasFlash = true;
			}
			
			if( $rootScope.hasFlash ){
				$scope.playerTemplate = 'flashplayer';
			} else {
				if( $rootScope.canPlayHTML() ){
					$scope.playerTemplate = 'htmlplayer';
				} else {
					$scope.playerTemplate = 'noplayback';
				}
			}
		}
	} ); 

	$rootScope.isMobile = {
		android: function() {
			return navigator.userAgent.match(/Android/i);
		},
		blackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
		iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
		opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
		windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
		any: function() {
			return ($rootScope.isMobile.android() ||
				$rootScope.isMobile.blackBerry() ||
				$rootScope.isMobile.iOS() ||
				$rootScope.isMobile.opera() ||
				$rootScope.isMobile.windows());
		}
	};

	$rootScope.canPlayHTML = function() {
		return 'poster' in document.createElement('video');
	}

	$rootScope.$on( 'replayer::event::error', function( event, error ) {
		var androidErrorMessage = $rootScope.configuration.errorAndroidMessage;
		if( $rootScope.isMobile.android() && androidErrorMessage && androidErrorMessage.length > 0 ) {
			alert( androidErrorMessage );
		}
	});
}]);


//=== Directive ===
REPlayer.directive('replayer', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/player/replayer.tpl.html',
		replace: true,
		scope: 'isolate',
		controller: 'REPlayerCtrl',
		link: function(scope, element, attrs) {
		}
	};
}); 

REPlayer.directive('flashplayer', function(){
	// Runs during compile
	return {
		restrict: 'E',
		templateUrl: 'templates/player/flashplayer.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function(scope, element, attrs) {
		}
	};
});

REPlayer.directive('htmlplayer', function(){
	// Runs during compile
	return {
		restrict: 'E',
		templateUrl: 'templates/player/htmlplayer.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function(scope, element, attrs) {
		}
	};
});

REPlayer.directive('noPlayback', function(){
	// Runs during compile
	return { 
		restrict: 'E',
		templateUrl: 'templates/player/noplayback.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function(scope, element, attrs) {
		}
	};
});

// Make angular.element a little nicer to use
var $ngEL = angular.element;
var AkamaiHTMLAnalytics = REPlayer.service('AkamaiHTMLAnalytics', 
	['$rootScope', '$document', function($rootScope, $document) {
	
	this.initialized = false;
	this.enabled = false;
	
	this.initialize = function() {
		var aaObj = $rootScope.configuration.plugins.AkamaiAnalytics;
		this.enabled = (aaObj && aaObj.enabled);
		if(!this.initialized && this.enabled) {
			var self = this;
			AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = $rootScope.configuration.plugins.AkamaiAnalytics.metadata.csmaConfigPath;
			
			// Dynamically load Akamai's Analytics lib
		    script = window.document.createElement('script');
		    script.type = 'text/javascript';
		    script.async = true;
		    script.onload = function(){
		        // Since Akamai does things in an inflexible manner, we need to do this :\
				var DOMContentLoaded_event = window.document.createEvent('Event');
				DOMContentLoaded_event.initEvent('DOMContentLoaded', true, true);
				window.document.dispatchEvent(DOMContentLoaded_event);
				
				if($rootScope.configuration.akamai.viewerID && 
				   $rootScope.configuration.akamai.viewerID !== '') {
					self.setViewerID($rootScope.configuration.AkamaiAnalytics.metadata.viewerID);
				}
				
				if($rootScope.configuration.akamai.viewerDiagnosticsID && 
				   $rootScope.configuration.akamai.viewerDiagnosticsID !== '') {
					self.setViewerDiagnosticsId($rootScope.configuration.akamai.viewerDiagnosticsID);
				}
		    };
		    
		    script.src = $rootScope.configuration.akamai.scriptURL;
		    
		    window.document.getElementsByTagName('head')[0].appendChild(script);
		    
		    this.initialized = true;
		}
	};
	
	this.reinitialize = function() {
		this.initalized = false;
		this.initalize();
	}
	
	this.setAnalyticsData = function(name, value) {
		if(this.enabled) {
			setAkamaiMediaAnalyticsData(name, value);
		}
	};
	
	this.setViewerID = function(viewerId) {
		if(this.enabled) {
			akamaiSetViewerId(viewerId);
		}
	};
	
	this.setViewerDiagnosticsId = function(viewerDiagnosticsId) {
		if(this.enabled) {
			akamaiSetViewerDiagnosticsId(viewerDiagnosticsId);
		}
	};
	
	this.facebookShare = function() {
		this.setAnalyticsData('socialShare:fbs', 1);
	};
	
	this.facebookLike = function() {
		this.setAnalyticsData('socialShare:fbl', 1);
	};
	
	this.twitterShare = function() {
		this.setAnalyticsData('socialShare:tws', 1);
	};
	
	this.mySpaceShare = function() {
		this.setAnalyticsData('socialShare:mys', 1);
	};
	
	this.googlePlusShare = function() {
		this.setAnalyticsData('socialShare:gps', 1);
	};
	
	this.yahooShare = function() {
		this.setAnalyticsData('socialShare:yhs', 1);
	};
}]);
var PlayerModule = angular.module( 'REPlayer.PlayerModule', [ 'REPlayer.HTMLPlayerModule', 'REPlayer.FlashPlayerModule', 'REPlayer.ControlbarModule', 'REPlayer.VControlbarModule', 'REPlayer.QOSPanelModule', 'iSP.TimelineMarker.services' ] );

PlayerModule.filter( 'playerTimeCode', function() {
	return function( s ) {
		var hours = Math.floor( s / 3600 ).toFixed();
		var minutes = Math.floor( ( s - ( hours * 3600 ) ) / 60 ).toFixed();
		var seconds = s - ( hours * 3600 ) - ( minutes * 60 );
		seconds = seconds.toFixed();

		if ( hours < 10 )
			hours = '0' + hours;

		if ( minutes < 10 )
			minutes = '0' + minutes;

		if ( seconds < 10 )
			seconds = '0' + seconds;

		var time = hours + ':' + minutes + ':' + seconds;
		if ( isNaN( hours ) || isNaN( minutes ) || isNaN( minutes ) )
			return "00:00:00";
		else
			return time;
	}
} );

PlayerModule.factory( 'PlayerAPI', [ '$rootScope', '$window',
	function( $rootScope, $window ) {

		var PlayerAPI = function() {
			this.initialize();
		};

		// State Types
		PlayerAPI.STATE_LOADING = 'replayer::state::loading';
		PlayerAPI.STATE_READY = 'replayer::state::ready';
		PlayerAPI.STATE_PLAYING = 'replayer::state::playing';
		PlayerAPI.STATE_SEEKING = 'replayer::state::seeking';
		PlayerAPI.STATE_PAUSED = 'replayer::state::paused';
		PlayerAPI.STATE_STOP = 'replayer::state::stop';
		PlayerAPI.STATE_ENDED = 'replayer::state::ended';
		PlayerAPI.STATE_ERROR = 'replayer::state::error';

		// Player Types
		PlayerAPI.TYPE_HTML_PLAYER = 'replayer::type::htmlPlayer';
		PlayerAPI.TYPE_FLASH_PLAYER = 'replayer::type::flashPlayer';

		// Event Types
		PlayerAPI.LOAD_START_EVENT = 'replayer::event::loadStart';
		PlayerAPI.CAN_PLAY_EVENT = 'replayer::event::canPlay';
		PlayerAPI.PLAY_EVENT = 'replayer::event::play';
		PlayerAPI.PAUSE_EVENT = 'replayer::event::pause';
		PlayerAPI.ENDED_EVENT = 'replayer::event::ended';
		PlayerAPI.TIME_UPDATE_EVENT = 'replayer::event::timeUpdate';
		PlayerAPI.SEEKING_EVENT = 'replayer::event::seeking';
		PlayerAPI.SEEKED_EVENT = 'replayer::event::seeked';
		PlayerAPI.BUFFERING_EVENT = 'replayer::event::buffering';
		PlayerAPI.BUFFERED_EVENT = 'replayer::event::buffered';
		PlayerAPI.DURATION_CHANGE_EVENT = 'replayer::event::durationChange';
		PlayerAPI.LOADED_METADATA_EVENT = 'replayer::event::loadedMetadata';
		PlayerAPI.CC_AVAILABLE_CHANGE_EVENT = 'replayer::event::ccAvailableChange';
		PlayerAPI.CC_ENABLED_CHANGE_EVENT = 'replayer::event::ccEnabledChange';
		PlayerAPI.ERROR_EVENT = 'replayer::event::error';
		PlayerAPI.RATE_CHANGE_EVENT = 'replayer::event::rateChange';
		PlayerAPI.VOLUME_EVENT = 'replayer::event::volumeChange'; // HTML ONLY
		PlayerAPI.TOGGLE_MUTE_EVENT = 'replayer::event::toggleMuteChange'; // HTML ONLY
		PlayerAPI.LOAD_COMPLETE_EVENT = 'replayer::event::loadComplete'; // FLASH ONLY
		PlayerAPI.STATE_CHANGE_EVENT = 'replayer::event::stateChange'; // FLASH ONLY
		PlayerAPI.RESIZE_EVENT = 'replayer::event::resize'; // FLASH ONLY
		PlayerAPI.FULLSCREEN_CHANGE_EVENT = 'replayer::event::fullscreenChange'; // FLASH ONLY
		PlayerAPI.PLAYER_TYPE_CHANGE_EVENT = 'replayer::event::playerTypeChange'; // FLASH ONLY
		PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT = 'replayer::event::mouseEnterVideoDisplay';
		PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT = 'replayer::event::mouseLeaveVideoDisplay';
		PlayerAPI.PIP_AVAILABE_CHANGE_EVENT = 'replayer::event::pipAvailableChangeEvent';
		PlayerAPI.PIP_SWAP_CHANGE_EVENT = 'replayer::event::pipSwapChangeEvent';

		$rootScope.configuration = undefined;
		$rootScope.playerRef = undefined;
		$rootScope.playerModule = undefined;
		$rootScope.playerType = undefined;
		$rootScope.playerState = undefined;
		$rootScope.loaded = undefined;
		$rootScope.canPlay = undefined;
		$rootScope.paused = undefined;
		$rootScope.source = undefined;
		$rootScope.volume = undefined;
		$rootScope.muted = undefined;
		$rootScope.defaultWidth = undefined;
		$rootScope.defaultHeight = undefined;
		$rootScope.width = undefined;
		$rootScope.height = undefined;
		$rootScope.duration = undefined;
		$rootScope.autoPlay = undefined;
		$rootScope.currentTime = undefined;
		$rootScope.loop = undefined;
		$rootScope.autoHideControls = undefined;
		$rootScope.poster = undefined;
		$rootScope.ccSource = undefined;
		$rootScope.ccAvailable = undefined;
		$rootScope.ccEnabled = undefined;
		$rootScope.bitrate = undefined;
		$rootScope.isSeeking = undefined;
		$rootScope.isFullscreen = undefined;
		$rootScope.rate = undefined;
		$rootScope.markers = undefined;
		$rootScope.lastMarkersString = undefined;
		// non-standard (iSP)
		$rootScope.convivaID = undefined;
		$rootScope.akamaiID = undefined;
		$rootScope.isLive = undefined;
		$rootScope.color = undefined;
		$rootScope.title = undefined;
		$rootScope.socialTitle = undefined;
		$rootScope.description = undefined;
		$rootScope.showDescription = undefined;
		$rootScope.embed = undefined;
		$rootScope.embedCode = undefined;
		$rootScope.share = undefined;
		$rootScope.estimtedLiveDuration = undefined;
		$rootScope.audioStreamName = undefined;
		$rootScope.captionStreamName = undefined;
		$rootScope.failoverURL = undefined;
		$rootScope.failoverURLType = undefined;
		$rootScope.html5URL = undefined;
		$rootScope.mediaURLType = undefined;

		//pip related
		$rootScope.mainSource = undefined;
		$rootScope.pipSource = undefined;
		$rootScope.showPIP = undefined;
		$rootScope.pipAvailable = undefined;
		$rootScope.pipSwappedInPage = undefined;

		PlayerAPI.prototype = angular.extend( PlayerAPI.prototype, {

			initialize: function() {
				if ( $window.hasOwnProperty( 'apiReady' ) ) {
					$window.apiReady( this );
				}

			},


			prevVolume: 1,


			//====================================
			// API Methods
			//====================================		
			setPlayerModule: function( value ) {

				$rootScope.playerModule = value;
				var self = this;
				$rootScope.$on( PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT, function() {
					$( self ).trigger( PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT );
				} );

				$rootScope.$on( PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT, function() {
					$( self ).trigger( PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT );
				} );

				if ( $window.hasOwnProperty( 'playerModuleReady' ) )
					$window.playerModuleReady( value );
			},

			setPlayerReference: function( value ) {
				$rootScope.playerRef = value;
				if ( $window.hasOwnProperty( 'playerReferenceReady' ) )
					$window.playerReferenceReady( value );

				// Now we can tell the player module to add it listeners since we know everything is available
				$rootScope.playerModule.initAPIListeners();
			},

			setTimelineMarkers: function( value ) {
				//Do comparison to see if data has actually changed 
				var thisMarkersString = angular.toJson( value );
				if ( $rootScope.lastMarkersString != thisMarkersString ) {
					//Set new data for comparisons in the future.
					$rootScope.lastMarkersString = thisMarkersString;

					//Actually set the data on the model and update the players
					$rootScope.configuration.markers = value;
					api.configuration.markers = value;
					window.config.markers = value;
					if ( $rootScope.playerRef ) {
						this.updateTimelineMarkers( value );
					} else {
						//Reset so this will run again once we have a player reference
						$rootScope.lastMarkersString = undefined;
					}
				}
			},

			configure: function( config ) {
				// console.log('$$$$$ config fired');
				$rootScope.configuration = config;
				$rootScope.playerModule.configure( config );
			},

			play: function() {
				var startTime;
				startTime = $rootScope.configuration.startTime;
				if ( $rootScope.hasFlash ) {
					if ( !$rootScope.autoPlay && startTime > 0 ) {
						this.seek( startTime );
						$rootScope.configuration.startTime = 0;
					}
				}
				$rootScope.playerModule.play();
			},

			pause: function() {
				$rootScope.playerModule.pause();
			},

			togglePause: function() {
				$rootScope.playerModule.togglePause();
			},

			stop: function() {
				$rootScope.playerModule.stop();
			},

			load: function( source ) {
				$rootScope.playerModule.load( source );
			},

			seek: function( time ) {
				$rootScope.playerModule.seek( time );
			},

			fastForward: function() {
				$rootScope.playerModule.fastForward();
			},

			rewind: function() {
				$rootScope.playerModule.rewind();
			},

			toggleFullScreen: function() {
				$rootScope.playerModule.toggleFullscreen();
			},

			toggleMute: function() {
				this.setMuted( !$rootScope.muted );
				$rootScope.playerModule.toggleMute();
			},

			setMuted: function( value ) {
				$rootScope.muted = value;
				$rootScope.$broadcast( PlayerAPI.TOGGLE_MUTE_EVENT, $rootScope.muted );
			},

			getMuted: function() {
				return $rootScope.muted;
			},

			setVolume: function( value ) {
				// Get the model up to date
				$rootScope.volume = value;
				$rootScope.$broadcast( PlayerAPI.VOLUME_EVENT, $rootScope.volume );
			},

			getConfiguration: function() {
				return $rootScope.configuration;
			},

			getPaused: function() {
				return $rootScope.paused;
			},

			getVolume: function() {
				return $rootScope.volume;
			},

			getDuration: function() {
				return $rootScope.duration;
			},

			getCurrentTime: function() {
				return $rootScope.currentTime;
			},

			getPlayerRect: function() {
				var rect = $rootScope.playerRef.getBoundingClientRect();
				return rect;
			},

			setPlayerState: function( state ) {
				$rootScope.playerState = state;
				$rootScope.$broadcast( PlayerAPI.STATE_CHANGE_EVENT, $rootScope.playerState );
			},

			setSize: function( size ) {
				$rootScope.width = size.width;
				$rootScope.height = size.height;

				if ( size.setDefaults ) {
					$rootScope.configuration.defaultWidth = size.width;
					$rootScope.configuration.defaultHeight = size.height;
				}

				$rootScope.$broadcast( PlayerAPI.RESIZE_EVENT, size );
			},

			setPaused: function( value ) {
				$rootScope.paused = value;
				this.setPlayerState( PlayerAPI.STATE_PAUSED );
				$rootScope.$broadcast( PlayerAPI.PAUSED_EVENT, $rootScope.paused );
			},

			setCCAvailable: function( value ) {
				$rootScope.ccAvailable = value;
				$rootScope.$broadcast( PlayerAPI.CC_AVAILABLE_CHANGE_EVENT, $rootScope.ccAvailable );
			},

			getCCAvailable: function() {
				return $rootScope.ccAvailable;
			},

			toggleCC: function() {
				$rootScope.ccEnabled = !$rootScope.ccEnabled;
				$rootScope.playerModule.toggleCC();
				$rootScope.$broadcast( PlayerAPI.CC_ENABLED_CHANGE_EVENT, $rootScope.ccEnabled );
			},

			getBitrate: function() {
				return $rootScope.bitrate;
			},

			setBitrate: function( value ) {
				$rootScope.bitrate = value;
			},

			playerReady: function() {
				// this.setPlayerState(PlayerModule.PlayerAPI.STATE_READY);

				console.log( "asldfasdkfla ppppasdflk ", $rootScope.playerState );
				$rootScope.$broadcast( PlayerAPI.STATE_CHANGE_EVENT, $rootScope.playerState );
			},

			playerPlaying: function() {
				// console.log('playerPlaying FIRED!');

				var startTime;
				startTime = $rootScope.configuration.startTime;
				if ( $rootScope.hasFlash ) {
					if ( $rootScope.configuration.autoPlay && startTime > 0 ) {
						this.seek( startTime );

						$rootScope.configuration.startTime = 0;
					}
				}

				this.setPlayerState( PlayerModule.PlayerAPI.STATE_PLAYING );
				$rootScope.$broadcast( PlayerAPI.STATE_CHANGE_EVENT, $rootScope.playerState );
			},

			setCanPlay: function( value ) {
				$rootScope.canPlay = value;
				$rootScope.$broadcast( PlayerAPI.CAN_PLAY_EVENT, $rootScope.canPlay );
			},

			loadStart: function() {
				$rootScope.loaded = false;
				$rootScope.$broadcast( PlayerAPI.LOAD_START_EVENT );
			},

			loadComplete: function() {
				$rootScope.loaded = true;
				$rootScope.$broadcast( PlayerAPI.LOAD_COMPLETE_EVENT );
			},

			hasEnded: function() {
				this.setPlayerState( PlayerModule.PlayerAPI.STATE_ENDED );
				$rootScope.$broadcast( PlayerAPI.ENDED_EVENT );
			},

			currentTimeChange: function( value ) {
				$rootScope.currentTime = value;
				// FIXME: Calc progress
				$rootScope.timeOutline = $rootScope.currentTime.toFixed();;
				$rootScope.videoProgress = ( ( $rootScope.currentTime / $rootScope.duration ) * 100 ).toFixed( 2 );
				$rootScope.$broadcast( PlayerAPI.TIME_UPDATE_EVENT, $rootScope.currentTime );
			},

			isSeeking: function() {
				this.setPlayerState( PlayerAPI.STATE_SEEKING );
				$rootScope.isSeeking = true;
				$rootScope.$broadcast( PlayerAPI.SEEKING_EVENT );
			},

			hasSeeked: function() {
				$rootScope.setIsSeeking = false;
				$rootScope.$broadcast( PlayerAPI.SEEKED_EVENT );
			},

			isBuffering: function() {
				this.setPlayerState( PlayerAPI.STATE_PAUSED );
				$rootScope.isBuffering = true;
				$rootScope.$broadcast( PlayerAPI.BUFFERING_EVENT );
			},

			hasBuffered: function() {
				$rootScope.isBuffering = false;
				$rootScope.$broadcast( PlayerAPI.BUFFERED_EVENT );
			},

			durationChange: function( value ) {
				$rootScope.duration = value;
				$rootScope.$broadcast( PlayerAPI.DURATION_CHANGE_EVENT, $rootScope.duration );
			},

			loadedMetadata: function( metadata ) {
				$rootScope.$broadcast( PlayerAPI.LOADED_METADATA_EVENT, metadata );
			},

			error: function( error ) {
				this.setPlayerState( PlayerAPI.STATE_ERROR );
				$rootScope.$broadcast( PlayerAPI.ERROR_EVENT, error );
			},

			rateChange: function( rate ) {
				$rootScope.rate = rate;
				$rootScope.$broadcast( PlayerAPI.RATE_CHANGE_EVENT, $rootScope.rate );
			},

			resize: function( size ) {
				$rootScope.size = size;
				$rootScope.$broadcast( PlayerAPI.RESIZE_EVENT, $rootScope.size );
			},

			fullscreenChange: function( value ) {
				$rootScope.isFullscreen = value;
				$rootScope.$broadcast( PlayerAPI.RATE_CHANGE_EVENT, $rootScope.isFullscreen );
			},

			setPlayerType: function( value ) {
				console.log( 'playerType was set with a value of - ', value );
				$rootScope.playerType = value;
				$rootScope.$broadcast( PlayerAPI.PLAYER_TYPE_CHANGE_EVENT, $rootScope.playerType );
			},

			getPlayerType: function() {
				return $rootScope.playerType;
			},

			updateTimelineMarkers: function( value ) {
				if ( $rootScope.playerModule.updateTimelineMarkers ) {
					$rootScope.playerModule.updateTimelineMarkers( value );
				}
			},

			playFileInPIP: function( value ) {
				$rootScope.pipSwappedInPage = true;
				if ( $rootScope.playerModule.playFileInPIP ) {
					$rootScope.playerModule.playFileInPIP( value );
				}
			},

			playFileInMain: function( value ) {
				if ( $rootScope.playerModule.playFileInMain ) {
					$rootScope.playerModule.playFileInMain( value );
					if ( $rootScope.playerType === PlayerModule.PlayerAPI.TYPE_HTML_PLAYER ) {
						akamaiHandleStreamSwitch();
					}
				}
			},

			togglePIP: function( value ) {
				$rootScope.showPIP = value;
				if ( $rootScope.playerModule.togglePIP ) {
					$rootScope.playerModule.togglePIP( value );
				}
			},

			swapPIPAndMain: function() {
				$rootScope.pipSwappedInPage = true;
				if ( $rootScope.playerModule.swapPIPAndMain ) {
					$rootScope.playerModule.swapPIPAndMain();
				}
			},

			setPIPSwap: function() {
				$rootScope.$broadcast( PlayerAPI.PIP_SWAP_CHANGE_EVENT, $rootScope.playerType );
			},

			setPIPAvailable: function( value ) {
				$rootScope.pipAvailable = value;
				$rootScope.$broadcast( PlayerModule.PlayerAPI.PIP_AVAILABE_CHANGE_EVENT, $rootScope.pipAvailable );
			},

			setPIPSwappedInPage: function( value ) {
				$rootScope.pipSwappedInPage = value;
			},

			getPIPAvailable: function() {
				return $rootScope.pipAvailable;
			},

			getPIPSwappedInPage: function() {
				return $rootScope.pipSwappedInPage;
			},
		} );

		PlayerModule.PlayerAPI = PlayerAPI;

		return new PlayerAPI();
	}
] );
var FlashPlayerModule = angular.module( 'REPlayer.FlashPlayerModule', [] );

FlashPlayerModule.controller( 'FlashPlayerCtrl', [ '$window', '$scope', '$element', '$attrs', 'PlayerAPI',
	function( $window, $scope, $element, $attrs, playerAPI ) {

		this.id = 'FlashPlayerModule';

		console.log( "version: ", angular.version );
		$scope.playerRef = $ngEL( '#flash-player' )[ 0 ];
		$scope.configuration = undefined;

		playerAPI.setPlayerType( PlayerModule.PlayerAPI.TYPE_FLASH_PLAYER );

		// ============================
		// API
		// ============================

		// Player to page
		$window.playerReady = function() {
			$scope.playerRef = $ngEL( '#flash-content' )[ 0 ];
			playerAPI.setPlayerReference( $scope.playerRef );

			if ( String( config.startTime ).indexOf( ':' ) === -1 ) {
				config.startTime = $scope.convertToTimecode( config.startTime );
			}

			$scope.playerRef.setConfig( config );
		}

		$window.durationchange = function( value ) {
			playerAPI.durationChange( value );

			playerAPI.setPIPAvailable( true );
		}

		$window.timeupdate = function( value ) {
			playerAPI.currentTimeChange( value );
		}

		$window.pause = function() {
			playerAPI.setPaused( true );
		}

		$window.play = function() {
			playerAPI.playerPlaying();
		}

		$window.onPIPSwap = function() {
			if ( playerAPI.getPIPSwappedInPage() ) {
				playerAPI.setPIPSwappedInPage( false );
			} else {
				playerAPI.setPIPSwap();
			}
		}

		// end: player to page



		$scope.convertToTimecode = function( s ) {
			var hours = Math.floor( s / 3600 ).toFixed();
			var minutes = Math.floor( ( s - ( hours * 3600 ) ) / 60 ).toFixed();
			var seconds = s - ( hours * 3600 ) - ( minutes * 60 );
			seconds = seconds.toFixed();

			if ( hours < 10 )
				hours = '0' + hours;

			if ( minutes < 10 )
				minutes = '0' + minutes;

			if ( seconds < 10 )
				seconds = '0' + seconds;

			var time = hours + ':' + minutes + ':' + seconds;
			if ( isNaN( hours ) || isNaN( minutes ) || isNaN( minutes ) )
				return "00:00:00";
			else
				return time;
		};

		this.configure = function( config ) {
			if ( String( config.startTime ).indexOf( ':' ) === -1 ) {
				config.startTime = $scope.convertToTimecode( config.startTime );
			}
			$scope.configuration = config;
			if ( $scope.playerRef !== undefined ) { // if we can push the config into the player
				$scope.playerRef.setConfig( config );
			}
		};

		this.load = function( source ) {
			$scope.playerRef.loadFlash( source );
		};

		this.play = function() {
			$scope.playerRef.playFlash();
			$scope.$emit( PlayerModule.PlayerAPI.PIP_AVAILABE_CHANGE_EVENT, true );
		};

		this.pause = function() {
			$scope.playerRef.pauseFlash();
		};

		this.togglePause = function() {
			// TODO: implement toggle pause
		};

		this.rewind = function() {
			console.log( 'rewind fired from FlashPlayerModule' );
			$scope.playerRef.rewindFlash();
		};

		this.fastForward = function() {
			$scope.playerRef.fastForwardFlash();
		};

		this.toggleMute = function() {
			$scope.playerRef.toggleMute();
		};

		this.setVolume = function( value ) {
			$scope.playerRef.setVolume( value );
		};

		this.setSize = function( event, value ) {
			console.log( '// TODO: setSize() fails when called on flash player.' );
			//$scope.playerRef.setSize(value.width, value.height);
			$ngEL( $scope.playerRef ).css( 'width', value.width );
			$ngEL( $scope.playerRef ).css( 'height', value.height );
		};

		this.toggleCC = function() {
			$scope.playerRef.toggleCC( !$scope.ccEnabled );
		};

		this.getCurrentTime = function() {
			$scope.playerRef.getCurrentTime();
			// $scope.playerRef.getCurrentTime()
		};

		this.seek = function( value ) {
			$scope.playerRef.seekFlash( value );
		};

		this.toggleFullscreen = function() {
			$scope.playerRef.toggleFullscreen();
		};

		this.getDuration = function() {
			return $scope.playerRef.getDuration();
		};

		this.setBitrate = function( value ) {
			$scope.playerRef.setBitrate( value );
		};

		this.getBitrate = function() {
			return $scope.playerRef.getBitrate();
		};

		this.updateTimelineMarkers = function( value ) {
			if ( $scope.playerRef ) {
				$scope.playerRef.updateTimelineMarkers( value );
			}
		};

		this.playFileInPIP = function( value ) {
			$scope.playerRef.playFileInPIP( value );
		};

		this.playFileInMain = function( value ) {
			$scope.playerRef.playFileInMain( value );
		};

		this.swapPIPAndMain = function() {
			$scope.playerRef.swapPIPAndMain();
		};

		this.togglePIP = function( value ) {
			$scope.playerRef.togglePIP( value );
		};

		this.initAPIListeners = function() {
			// TODO: API Events
			/*$scope.playerRef.addEventListener('durationchange', function(e) {
				playerAPI.durationChange($scope.playerRef.duration);
			}, false);
			
			$scope.playerRef.addEventListener('timeupdate', function(e) {
				playerAPI.currentTimeChange($scope.playerRef.currentTime);
			}, false);*/
		}

		// Let the API know this module is ready to go 
		playerAPI.setPlayerModule( this );


		// ============================
		// Control
		// ============================

		$scope.onMouseEnterVideo = function() {
			$scope.$emit( PlayerModule.PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT );
		};

		$scope.onMouseLeaveVideo = function() {
			$scope.$emit( PlayerModule.PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT );
		};

		$scope.$on( PlayerModule.PlayerAPI.RESIZE_EVENT, this.setSize );
	}
] );

FlashPlayerModule.directive( 'flashPlayer', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			//scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'FlashPlayerCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			templateUrl: 'templates/player/flash/flash-player.tpl.html',
			replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			link: function( $scope, $element, $attr, controller ) {

				$element.css( 'width', config.defaultWidth + 46 );
				$element.css( 'height', config.defaultHeight );

				// For version detection, set to min. required Flash Player version, or 0 (or 0.0.0), for no version detection. 
				var swfVersionStr = '11.2.0';
				// To use express install, set to playerProductInstall.swf, otherwise the empty string. 
				var xiSwfUrlStr = 'playerProductInstall.swf';

				var flashvars = {
					debug: '1',
					config: encodeURIComponent( JSON.stringify( $scope.configuration ) )
				};

				var params = {};
				params.quality = 'high';
				params.bgcolor = '#000000';
				params.allowScriptAccess = 'always';
				params.allowFullScreen = 'true';
				params.wmode = "direct";

				var attributes = {};
				attributes.id = 'flash-content';
				attributes.name = 'flash-content';
				attributes.align = 'middle';
				swfobject.embedSWF(
					'flash/player.swf', 'flash-content',
					config.defaultWidth || '100%',
					config.defaultHeight || '100%',
					swfVersionStr, xiSwfUrlStr,
					flashvars, params, attributes );
				// JavaScript enabled so display the flashContent div in case it is not replaced with a swf object.
				swfobject.createCSS( '#flash-content', 'display:block;text-align:left;' );
			}
		};
	}
] );
var HTMLPlayerModule = angular.module( 'REPlayer.HTMLPlayerModule', [] );

HTMLPlayerModule.controller( 'HTMLPlayerCtrl', [ '$scope', '$rootScope', 'PlayerAPI', 'AkamaiHTMLAnalytics',
	function( $scope, $rootScope, playerAPI, akamaiAnalytics ) {
		this.id = 'HTMLPlayerModule';
		playerAPI.setPlayerType( PlayerModule.PlayerAPI.TYPE_HTML_PLAYER );

		this.akamaiAnalytics = undefined;

		//$scope.playerRef = undefined;
		$scope.configuration = undefined;
		$scope.displayPlayOverlay = 'hidden';
		$scope.displayFakePoster = 'hidden';
		$scope.isDVR = false;

		$scope.seekable = [];
		$scope.buffered = [];
		$scope.played = [];
		$scope.seekableOut = 'Seekable: ';
		$scope.bufferedOut = 'Buffered: ';
		$scope.playedOut = 'Out: ';
		$scope.sourceObj = {};
		$scope.hideControlBars = false;

		$scope.isMobile = $rootScope.isMobile.any();


		$scope.onClickPlayOverlay = function() {
			// playerAPI.play();
			$scope.playerRef.play();
			$rootScope.pipAvailable = true;
			$rootScope.$broadcast( PlayerModule.PlayerAPI.PIP_AVAILABE_CHANGE_EVENT, $rootScope.pipAvailable );
		}

		$scope.hidePlayOverlay = function() {
			$scope.displayPlayOverlay = 'hidden';
			$scope.$apply();
			$scope.hideControlBars = false;
		}

		$scope.showPlayOverlay = function() {
			$scope.displayPlayOverlay = 'visible';
			$scope.hideControlBars = $scope.isMobile && window.isPhone;
		}

		$scope.hideFakePoster = function() {
			$scope.displayFakePoster = 'hidden';
			$scope.$apply();
			$scope.hideControlBars = false;
		}

		$scope.showFakePoster = function() {
			$scope.displayFakePoster = 'visible';
			$scope.hideControlBars = $scope.isMobile && window.isPhone;
		}


		// ==============================
		// API
		// ==============================

		this.configure = function( config ) {
			$scope.configuration = config;
		}

		this.load = function( source ) {
			$ngEL( $scope.playerRef ).attr( 'src', source );
			$scope.playerRef.load();
		};

		this.play = function() {
			if ( $scope.playerRef.plabackrate !== 1 ) {
				$scope.playerRef.plabackrate = 1;
			}
			$scope.playerRef.play();
			$rootScope.pipAvailable = true;
			$rootScope.$broadcast( PlayerModule.PlayerAPI.PIP_AVAILABE_CHANGE_EVENT, $rootScope.pipAvailable );
		};

		this.pause = function() {
			$scope.playerRef.pause();
		};

		this.togglePause = function() {
			if ( !$scope.playerRef.paused ) {
				$scope.playerRef.pause();
			} else {
				$scope.playerRef.play();
			}
		};

		this.rewind = function() {
			console.log( 'rewind fired from HTMLPlayerModule' );
			$scope.playerRef.plabackrate = -2;
		};

		this.fastForward = function() {
			$scope.playerRef.plabackrate = 2;
		};

		//FIXME - most of this can be done using ngClass
		this.toggleMute = function() {
			$scope.playerRef.muted = !$scope.playerRef.muted;
		};

		this.setVolume = function( value ) {
			console.log( value );
			var newValue = value.toFixed( 2 );
			if ( value ) {
				$scope.playerRef.volume = newValue;
			}
		};

		this.toggleCC = function() {
			if ( $scope.playerRef.webkitHasClosedCaptions ) {
				$scope.playerRef.webkitClosedCaptionsVisible = !$scope.playerRef.webkitClosedCaptionsVisible;
			}
			console.log( 'Show captions?', $scope.playerRef.webkitClosedCaptionsVisible );
		};

		this.getCurrentTime = function() {
			$scope.playerRef.getCurrentTime();
			// $scope.playerRef.getCurrentTime()
		};

		this.seek = function( value ) {
			// console.debug('seek', value);
			// console.log( "player ref ##$$$$ " + $scope.playerRef );
			$scope.playerRef.currentTime = value;
		};

		this.toggleFullscreen = function() {
			var elem = $scope.playerRef;
			if ( elem.requestFullscreen ) {
				elem.requestFullscreen();
			} else if ( elem.mozRequestFullScreen ) {
				elem.mozRequestFullScreen();
			} else if ( elem.webkitRequestFullscreen ) {
				elem.webkitRequestFullscreen();
			} else if ( elem.webkitEnterFullscreen ) {
				elem.webkitEnterFullscreen();
			}
		};

		this.playFileInMain = function( value ) {
			$scope.sourceObj = value;
		};

		this.initAPIListeners = function() {
			var self = this;
			// TODO: API Events

			// $scope.playerRef.addEventListener('webkitendfullscreen', function(event) {
			// 	// $scope.playerRef.play();
			// 	console.log('webkitendfullscreen fired');
			// 	playerAPI.pause();
			// }, false);

			$scope.playerRef.addEventListener( 'durationchange', function( event ) {
				// console.debug('durationchange', $scope.playerRef.duration);
				$scope.isDVR = $scope.playerRef.duration === Infinity;
				playerAPI.durationChange( $scope.playerRef.duration );

			}, false );

			$scope.playerRef.addEventListener( 'loadeddata', function( event ) {
				var elem = $scope.playerRef;
				if ( elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.webkitEnterFullscreen ) {
					// console.log('Hooray for fullscreen!');
				} else {
					// console.log('sad, no fullscreen for you.');
					$ngEL( '#fullscreen-btn' ).hide();
					// $ngEL('#control-bar').css('width', $scope.configuration.defaultWidth +46);
				}
			} );

			$scope.playerRef.addEventListener( 'progress', function( event ) {
				if ( $scope.configuration.startTime > 0 && $scope.playerRef.duration > 0 ) {
					$scope.playerRef.currentTime = $scope.configuration.startTime;
					$scope.configuration.startTime = 0;
				}
			} );

			$scope.playerRef.addEventListener( 'volumechange', function( event, value ) {
				console.log( "woot woot the volume has changed", event );
				console.log( "woot woot the value is", $scope.playerRef.muted );
				var volume;
				var muted;
				if ( $scope.playerRef.muted ) {
					volume = 0;
					muted = true;
				} else {
					volume = $scope.playerRef.volume;
					muted = false;
				}

				if ( playerAPI.getMuted() !== muted ) {
					playerAPI.setMuted( muted );
				}

				if ( playerAPI.getVolume() !== volume ) {
					playerAPI.setVolume( volume );
				}
			} );

			$scope.$on( PlayerModule.PlayerAPI.VOLUME_EVENT, function( event, value ) {
				if ( $scope.playerRef.volume !== value ) {
					self.setVolume( value );
				}
			} );

			$scope.playerRef.addEventListener( 'timeupdate', function( event ) {

				// ===============================================================
				// NOTE - This code is necessary to make Start Time work on Android
				if ( $rootScope.isMobile.android() ) {
					if ( $scope.configuration.startTime && $scope.configuration.startTime > 0 ) {
						$scope.playerRef.currentTime = $scope.configuration.startTime;
						if ( $scope.playerRef.currentTime >= $scope.configuration.startTime ) {
							$scope.configuration.startTime = 0;
						}
					}
				}
				// END NOTE
				// ===============================================================

				if ( $scope.playerRef.webkitHasClosedCaptions ) {
					playerAPI.setCCAvailable( true );
				} else {
					playerAPI.setCCAvailable( false );
				}

				if ( $scope.isDVR && !$scope.playerRef.seeking ) {

					$scope.seekable = $scope.playerRef.seekable;
					$scope.buffered = $scope.playerRef.buffered;
					$scope.played = $scope.playerRef.played;

					// var start = $scope.playerRef.startTime;
					var end = 0;
					var duration = 0;
					if ( $scope.playerRef.buffered.length - 1 > -1 ) {
						duration = $scope.playerRef.seekable.end( 0 );
						end = $scope.playerRef.buffered.end( $scope.playerRef.buffered.length - 1 );
					}

					playerAPI.durationChange( duration );

					playerAPI.currentTimeChange( $scope.playerRef.currentTime );
					$scope.$apply();

				} else if ( !$scope.playerRef.seeking ) {

					playerAPI.currentTimeChange( $scope.playerRef.currentTime );

				}
			}, false );

			$scope.playerRef.addEventListener( 'play', function( event ) {
				playerAPI.playerPlaying();
				$scope.hidePlayOverlay();
				$scope.hideFakePoster();
			}, false );

			$scope.playerRef.addEventListener( 'pause', function( event ) {
				// console.log('pause fired from the video');
				playerAPI.setPaused( true );
				$scope.showPlayOverlay();
				$scope.$apply();
			}, false );

			$scope.playerRef.addEventListener( "ended", function() {
				playerAPI.hasEnded();
			} );

			$scope.playerRef.addEventListener( 'error', function( event ) {
				switch ( event.target.error.code ) {
					case event.target.error.MEDIA_ERR_ABORTED:
						{
							// console.debug('MEDIA ERROR: Aborted.');
							break;
						}
					case event.target.error.MEDIA_ERR_DECODE:
						{
							// console.debug('MEDIA ERROR: Decoding.');
							break;
						}
					case event.target.error.MEDIA_ERR_NETWORK:
						{
							// console.debug('MEDIA ERROR: Network.');
							break;
						}
					case event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
						{
							// console.debug('MEDIA ERROR: Source not supported.');
							break;
						}
				}
			} );

			var sources = $ngEL( $scope.playerRef ).find( 'source' );
			var lastSource = sources[ sources.length - 1 ];
			lastSource.addEventListener( 'error', function( event ) {
				$scope.hidePlayOverlay();
				$scope.hideFakePoster();
				/* Replace the entire player element
				var errorSlateImage = document.createElement('img');
				errorSlateImage.src = $scope.configuration.errorSlate;
				$ngEL($scope.playerRef).replaceWith(errorSlateImage);*/
				// Replace the poster frame
				$ngEL( $scope.playerRef ).attr( 'poster', $scope.configuration.errorSlate );
				playerAPI.error( event.error );
			} );

			akamaiAnalytics.initialize();
		}

		// Let the API know this module is ready to go 
		playerAPI.setPlayerModule( this );


		// =============================
		// Control
		// =============================

		$scope.onMouseEnterVideo = function() {
			$scope.$emit( PlayerModule.PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT );
		};

		$scope.onMouseLeaveVideo = function() {
			$scope.$emit( PlayerModule.PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT );
		};
	}
] );

HTMLPlayerModule.directive( 'htmlPlayer', [ '$timeout', 'PlayerAPI',
	function( $timeout, playerAPI ) {
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			//scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'HTMLPlayerCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			templateUrl: 'templates/player/html/html-player.tpl.html',
			replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			link: function( $scope, $element, $attr, controller ) {

				// Position the Play Overlay Button
				var overlay = $ngEL( '#play-btn-overlay' );
				var top = $scope.configuration.defaultHeight / 2 - overlay.height() / 2;
				var left = $scope.configuration.defaultWidth / 2 - overlay.width() / 2;

				overlay.css( 'top', top );
				overlay.css( 'left', left );

				$scope.$watch( 'sourceObj', function( sourceObj ) {
					if ( sourceObj.html5URL ) {
						var video = $scope.playerRef;
						var videoPlaying = false;
						video.pause();
						$ngEL( video ).empty();
						createSourceElement( sourceObj.html5URL );
						createSourceElement( sourceObj.html5FailoverURL );
						createSourceElement( sourceObj.url );

						video.load();

						video.play();
					}
				} );

				if ( !$scope.configuration )
					throw new Error( 'The player requires a configuration object.' );

				$scope.playerRef = $ngEL( '#html-player' )[ 0 ];
				// $ngEL($scope.playerRef).attr('preload', 'auto');
				if ( $scope.configuration.poster && $scope.configuration.poster !== '' ) {
					// $ngEL($scope.playerRef).attr('poster', $scope.configuration.poster);
					$ngEL( '#fake-poster' ).css( 'background-image', 'url(' + $scope.configuration.poster + ')' );
				}

				if ( $scope.configuration.defaultWidth && $scope.configuration.defaultWidth !== '' ) {
					$ngEL( $scope.playerRef ).css( 'width', $scope.configuration.defaultWidth );
				}

				if ( $scope.configuration.defaultHeight && $scope.configuration.defaultHeight !== '' ) {
					$ngEL( $scope.playerRef ).css( 'height', $scope.configuration.defaultHeight );
				}

				if ( !$scope.isMobile ) { //Tests if not mobile
					if ( $scope.configuration.volume && $scope.configuration.volume !== '' ) {
						if ( $scope.configuration.volume > 1 ) {
							$scope.configuration.volume = 1;
						};
						$scope.playerRef.volume = ( $scope.configuration.volume ); // * 0.01);
					}

					if ( $scope.configuration.autoPlay && $scope.configuration.autoPlay !== '' ) {
						$ngEL( $scope.playerRef ).attr( 'autoplay', 'autoplay' );
					}
				} else { //if mobile remove marker titles
					angular.forEach( $scope.configuration.markers, function( value, key ) {
						value.text = '';
					} );
					$scope.configuration.autoPlay = false;
				}

				// Show/Hide the play button
				if ( !$scope.configuration.autoPlay ) {
					$scope.showPlayOverlay();
					$scope.showFakePoster();
				}

				function createSourceElement( contentURL ) {
					var source = document.createElement( 'source' );
					source.src = contentURL;
					$ngEL( $scope.playerRef ).append( source );
					return source;
				}
				var canPlayType = '';
				createSourceElement( $scope.configuration.html5URL );
				createSourceElement( $scope.configuration.failoverURL );
				createSourceElement( $scope.configuration.source );

				// ===============================================================
				// NOTE - This code is necessary for adding native controls to
				//				Firefox only
				document.addEventListener( "mozfullscreenchange", function( event ) {
					// console.log('Fullscreen Change Event fired in Firefox');
					// console.log('Fullscreen is currently - ', document.mozFullScreen);
					if ( document.mozFullScreen ) {
						// console.log('Firefox IS in fullscreen');
						// console.log('Adding controls to ', $scope.playerRef);
						$ngEL( '#html-player' ).attr( 'controls', true );
					} else {
						// console.log('Firefox IS NOT in fullscreen');
						$ngEL( $scope.playerRef ).removeAttr( 'controls' );
					}
					// END NOTE
					// ===============================================================

				} );

				//Moving later to ensure we get the video data in iframes
				$timeout( function() {
					$ngEL( $scope.playerRef ).load();
				}, 0 );

				playerAPI.setPlayerReference( $scope.playerRef );

				this.setSize = function( event, value ) {

					$ngEL( $scope.playerRef ).css( 'width', value.width );
					$ngEL( $scope.playerRef ).css( 'height', value.height );
					$ngEL( $element ).find( '#fake-poster' ).css( 'width', value.width );
					$ngEL( $element ).find( '#fake-poster' ).css( 'height', value.height );

					var left = value.width / 2;

					overlay.css( 'top', top );
					overlay.css( 'left', left );


				};

				$scope.$on( PlayerModule.PlayerAPI.RESIZE_EVENT, this.setSize );
			}
		};
	}
] );
var ControlbarModule = angular.module( 'REPlayer.ControlbarModule', [] );

ControlbarModule.controller( 'ControlbarCtrl', [ '$window', '$rootScope', '$scope', '$timeout', 'PlayerAPI',
	function( $window, $rootScope, $scope, $timeout, playerAPI ) {

		$scope.videoVolume = 100; //$scope.configuration.volume * 100;
		$scope.controlBarVisible = 'hidden'; //$scope.configuration.autoHideControls ? 'hidden':'visible';

		$scope.playPause = 'paused';

		$scope.isOnlyLive = undefined;

		$scope.volumeBarVisible = 'hidden';
		$scope.volumeBarHeight = '20px';

		$scope.hideControlbarPromise = undefined;

		$scope.timeScrubVisible = 'hidden';
		$scope.scrubTime = '00:00:00';
		$scope.isMobile = $rootScope.isMobile.any();

		$scope.muted = false;
		$scope.showVol = true;

		$scope.$watch( 'configuration', function() {
			if ( $scope.configuration ) {
				// console.log('the modWidth is going to be - ', $scope.configuration.defaultWidth * 1)/;
				$scope.videoVolume = $scope.configuration.volume * 100;
				$scope.controlBarVisible = $scope.configuration.autoHideControls ? 'hidden' : 'visible';
			}
		} );

		$scope.onClickPlayPause = function() {
			if ( $scope.playPause == "paused" ) {
				playerAPI.play();
				$scope.playPause = "playing";
			} else if ( $scope.playPause == "playing" ) {
				playerAPI.pause();
				$scope.playPause = "paused";
			}
		};

		$scope.onClickPlay = function() {
			playerAPI.play();
		};

		$scope.onClickPause = function() {
			//playerAPI.pause();
			playerAPI.togglePause();
		};

		$scope.onClickFastForward = function() {
			playerAPI.fastForward();
		};

		$scope.onClickRewind = function() {
			playerAPI.rewind();
		};

		$scope.onClickBack15 = function() {
			// playerAPI.rewind();
			var currentTime = $scope.currentTime;
			var rewindTime = currentTime - $scope.configuration.playerReplayOffset;
			if ( rewindTime <= 0 ) {
				playerAPI.seek( 0 );
			} else {
				playerAPI.seek( rewindTime );
			}
		};

		$scope.onClickToggleMute = function() {
			$scope.muted = $scope.playerRef.muted;
			$scope.showVol = !$scope.muted;
			playerAPI.toggleMute();
		};

		$scope.onClickToggleFullScreen = function() {
			playerAPI.toggleFullScreen();
		};

		$scope.onClickProgressBar = function( event ) {
			playerAPI.seek( $scope.scrubTime );
		};

		$scope.showHideTimeout = function() {
			var now = ( new Date ).getTime();
			if ( ( now - $scope.lastMouseMove ) >= $scope.configuration.autoHideControlsDelay ) {
				$scope.hideControlbar();
			} else {
				$scope.setHideTimeout()
			}
		}

		$scope.setHideTimeout = function() {
			if ( $scope.configuration.autoHideControls ) {
				$timeout( $scope.showHideTimeout, $scope.configuration.autoHideControlsDelay );
			}
		}

		$scope.onMouseOverControlbar = function() {
			if ( $scope.controlBarVisible !== 'visible' ) {
				//$scope.controlBarVisible = 'visible';
			}
		};

		$scope.showControlbar = function() {
			if ( $scope.controlBarVisible !== 'visible' ) {
				$scope.controlBarVisible = 'visible';
			}
		};

		$scope.hideControlbar = function() {
			$scope.controlBarVisible = 'hidden';
			$scope.onMouseOutProgressBar();
		};

		$scope.onMouseOverProgressBar = function( event ) {
			$scope.timeScrubVisible = 'visible';
			$scope.progressBarUpdate( event );
		};

		$scope.onMouseOutProgressBar = function( event ) {
			$scope.timeScrubVisible = 'hidden';
		};

		$scope.onMouseOverMarker = function( value ) {
			$scope.hovered = value;
		};

		$scope.onMouseOutMarker = function() {
			$scope.hovered = '';
		};

		$scope.onMouseOverMute = function( event ) {
			$scope.volumeBarVisible = 'visible';
		};

		$scope.onMouseOutMute = function( event ) {
			$scope.volumeBarVisible = 'hidden';
		};

		$scope.onMouseOverVolumeBar = function( event ) {
			$scope.volumeBarUpdate( event );
		};

		$scope.progressBarStyle = function() {
			// var progress = $scope.videoProgress + '%;';
			// var color = '#' + $scope.configuration.color;
			if ( $scope.configuration && $scope.configuration.color ) {
				var progressBarStyle = {
					backgroundColor: '#' + $scope.configuration.color,
					width: $scope.videoProgress + '%'
				};
			} else {
				var progressBarStyle = {
					width: $scope.videoProgress + '%'
				};
			}

			// $scope.myprop = function() {
			//     return {
			//         display: $scope.master.display,
			//         backgroundColor: "#333",
			//         width: $scope.master.width + 'px',
			//         height: $scope.master.height + 'px',
			//         color: "#FFF"
			//     };



			return progressBarStyle;
		};

		$scope.progressStyle = function() {
			var progressClass = 'progress-container';
			if ( $rootScope.isMobile.any() ) {
				progressClass = progressClass + ' mobile-progress';
			}
			return progressClass;
		};

		$scope.onClickVolumeBar = function( event ) {
			playerAPI.setVolume( $scope.volbarVolume );
			volHeight = $scope.volbarVolume * 75 + 'px';
			$scope.volumeBarHeight = $scope.volbarVolume * 75;
		};

		// NOTE - Moved markerPosition and markerColor back out
		//				here in order to allow for iSP's request of
		//				constant polling. Could be refactored similar
		//				to previous implementation if a polling interval
		//				(like every 15 seconds) is implemented.

		$scope.markerPosition = function( value ) {
			// console.log('Getting Position for Marker ', value);
			// console.log('The Marker Time is ', $scope.markers[value].time);
			var markerPercent = undefined;
			var positionString = undefined;
			var markerConfigTime = $scope.configuration.markers[ value ].time;
			var a = markerConfigTime.split( ':' ); // split it at the colons
			var seconds = ( +a[ 0 ] ) * 60 * 60 + ( +a[ 1 ] ) * 60 + ( +a[ 2 ] );
			// console.log('The Marker is at ',seconds);
			if ( seconds <= $scope.duration ) {
				markerPercent = ( ( seconds / $scope.duration ) * 100 ).toFixed( 2 );
				// console.log('The Marker Percentage is ',markerPercent);
				positionString = {
					left: markerPercent + '%'
				};
			} else {
				positionString = {
					visibility: 'hidden'
				};
			}
			return positionString;
		}

		// $scope.markerColor = function(value) {
		// 	var themeColor = '#' + $scope.configuration.color;
		// 	var passedColor = '#CCCCCC';
		// 	var currentColor = themeColor;
		// 	var markerConfigTime = $scope.configuration.markers[value].time;
		// 	var a = markerConfigTime.split(':'); // split it at the colons
		// 	var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
		// 	if ( seconds >= $scope.currentTime ) {
		// 		currentColor = themeColor;
		// 	} else {
		// 		currentColor = passedColor;
		// 	}
		// 	return currentColor;
		// }

		$scope.progressBarUpdate = function( event ) {
			var event = event || $window.event;
			var bg = $ngEL( '#progress-bar-bg' );
			//This returns the offset of the progress bar to the browser window
			//so the values are only useful if used to refer to each other ex:progRect.right - progRect.left
			if ( !bg[ 0 ] ) {
				return;
			}
			var progRect = bg[ 0 ].getBoundingClientRect();

			var scrubDisplay = $ngEL( '#timeScrubDisplay' );

			if ( !scrubDisplay[ 0 ] ) {
				return;
			}
			var scrubRect = scrubDisplay[ 0 ].getBoundingClientRect();

			//event.clientX is the mouse position in browser window
			x = event.clientX - progRect.left;
			progWidth = progRect.right - progRect.left;
			scrubDisplayWidth = scrubRect.right = scrubRect.left;
			$scope.scrubTime = $scope.duration * ( x / progWidth );
			scrubDisplay.css( 'left', x - 50 );
		}

		$scope.volumeBarUpdate = function( event ) {
			event = event || $window.event;
			var volBg = $ngEL( '#volume-bar-total' );
			$scope.mouseY = event.clientY;
			if ( !volBg[ 0 ] ) {
				return;
			}
			var volProgRect = volBg[ 0 ].getBoundingClientRect();
			y = event.clientY - volProgRect.bottom;
			volHeight = volProgRect.top - volProgRect.bottom;
			$scope.volbarVolume = y / volHeight;
		};

		// =================================
		// Control
		// =================================

		$scope.mouseInVerticalBounds = function( rect ) {
			if ( $scope.mouseY < rect.bottom && $scope.mouseY > rect.top ) {
				return true;
			} else {
				return false;
			}
		}

		$scope.mouseInHorizontalBounds = function( rect ) {
			if ( $scope.mouseX > rect.left && $scope.mouseX < rect.right ) {
				return true;
			} else {
				return false;
			}
		};

		$scope.mouseInBounds = function( rect ) {
			if ( $scope.mouseInHorizontalBounds( rect ) && $scope.mouseInVerticalBounds( rect ) ) {
				return true;
			} else {
				return false;
			}
		}

		// =================================
		// Listeners
		// =================================

		$scope.$on( PlayerModule.PlayerAPI.STATE_CHANGE_EVENT, function( event, state ) {
			if ( state === PlayerModule.PlayerAPI.STATE_PLAYING ) {
				$scope.playPause = 'playing';
			} else if ( state === PlayerModule.PlayerAPI.STATE_PAUSED ) {
				$scope.playPause = 'paused';
			}
			$scope.$apply();
		} );

		$scope.$on( PlayerModule.PlayerAPI.DURATION_CHANGE_EVENT, function( event, duration ) {
			// console.debug('ControlbarModule just heard a duration change and it was ', duration);
			// console.debug('Also, just so you know, isLive is currnently ', $scope.configuration.isLive);
			// if($rootScope.configuration.isLive) {
			// console.debug('The config says isLive, should we use it?');
			if ( duration === 0 || duration === Infinity ) {
				$scope.isOnlyLive = true;
				$scope.implementLiveBar();
			} else {
				if ( $scope.isOnlyLive ) {
					$scope.isOnlyLive = false;
					$scope.implementVODBar();
				}
				// $scope.configuration.isLive = false;
			}
			// }
		} );

		$rootScope.$on( PlayerModule.PlayerAPI.MOUSE_ENTER_VIDEO_DISPLAY_EVENT, function() {
			$scope.showControlbar();
			$scope.lastMouseMove = ( new Date ).getTime();
		} );

		$rootScope.$on( PlayerModule.PlayerAPI.MOUSE_LEAVE_VIDEO_DISPLAY_EVENT, function() {
			$scope.lastMouseMove = ( new Date ).getTime();
			$scope.setHideTimeout();
		} );

		$scope.$on( PlayerModule.PlayerAPI.TOGGLE_MUTE_EVENT, function( event, muted ) {

			$scope.muted = muted;
			$scope.showVol = !$scope.muted;
			// if(!$scope.playerRef.muted) {
			// 	$ngEL('#mute-btn').css('background-color', '#'+$scope.configuration.color);
			// 	$ngEL('#mute-btn').addClass('selected');
			// 	$ngEL('#volume-bar-wrapper').hide();
			// } else {
			// 	$ngEL('#mute-btn').removeClass('selected');
			// 	$ngEL('#volume-bar-wrapper').show();
			// }

		} );
	}
] );


ControlbarModule.directive( 'controlBar', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			// name: '',
			// priority: 1,
			// terminal: true,
			//scope: {}, // {} = isolate, true = child, false/undefined = no change
			controller: 'ControlbarCtrl',
			// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			templateUrl: 'templates/player/html/controlbar.tpl.html',
			replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			link: function( $scope, $element, $attr, controller ) {

				$scope.$on( PlayerModule.PlayerAPI.VOLUME_EVENT, function( event, value ) {
					if ( value !== $scope.volbarVolume ) {
						$scope.volumeBarHeight = value * 75 + 'px';
						var y = value * 75;

						var volBg = $ngEL( '#volume-bar-total' );
						if ( !volBg[ 0 ] ) {
							return;
						}
						var volProgRect = volBg[ 0 ].getBoundingClientRect();
						volHeight = volProgRect.top - volProgRect.bottom;
						$scope.volbarVolume = y / volHeight;
					}
				} );

				$scope.implementLiveBar = function() {
					$scope.isOnlyLive = true;
					$ngEL( '#rewind-btn' ).hide();
					$ngEL( '#time' ).hide();
					$ngEL( '#timeScrubDisplay' ).hide();
					$ngEL( '.timeline-marker' ).hide();
					$ngEL( '#progress-container' ).css( {
						'margin-left': '52px',
						'margin-right': '24px'
					} );
					if ( $scope.isMobile ) {
						$ngEL( '#progress-container' ).css( {
							'height': '12px',
							'top': '12px'
						} );
						$scope.progressStyle();
					}
				}

				$scope.implementVODBar = function() {
					$scope.isOnlyLive = false;
					$ngEL( '#rewind-btn' ).show();
					$ngEL( '#time' ).show();
					$ngEL( '#timeScrubDisplay' ).show();
					$ngEL( '.timeline-marker' ).show();
					$ngEL( '#progress-container' ).css( {
						'margin-left': '85px',
						'margin-right': '182px'
					} );
					if ( $scope.isMobile ) {
						$ngEL( '#progress-container' ).css( {
							'height': '',
							'top': ''
						} );
						$ngEL( '#timeScrubDisplay' ).hide();
						$scope.progressStyle();
					}
				}

				$scope.$watch( 'configuration', function() {
					if ( $scope.configuration ) {


						var modWidth = $scope.configuration.defaultWidth * 1;
						$element.css( 'width', modWidth ); //+46);

						// TODO: we could have the vertical position dynamic based on a config value (under, bottom top, floating etc...)
						$element.css( 'margin-top', '-46px' );

						// $ngEL('#progress-bar').css('background', '#'+$scope.configuration.color);
						$ngEL( '#volume-bar-total' ).css( 'background', '#' + $scope.configuration.color );
						$ngEL( '#volume-bar' ).css( 'background', '#' + $scope.configuration.color );
						$scope.volumeBarHeight = $scope.configuration.volume * 75;

						// if( $scope.configuration.isLive ) { // Hide the mute button if we're on mobile
						// 	console.debug('hey, isLive is set to true, what\'s the frequency kenneth?', $scope.playerRef.duration );
						// 	if($scope.playerRef.duration === 0 || $scope.playerRef.duration === Infinity) {
						// 		$scope.isOnlyLive = true;
						// 		$ngEL('#rewind-btn').hide();
						// 		$ngEL('#time').hide();
						// 		$ngEL('#timeScrubDisplay').hide();
						// 		$ngEL('.timeline-marker').hide();
						// 		$ngEL('#progress-container').css({'margin-left':'52px','margin-right':'24px'});
						// 		if($rootScope.isMobile.any()) {
						// 			$ngEL('#progress-container').css({'height':'12px','top':'12px'});
						// 		}
						// 	} else {
						// 		$scope.isOnlyLive = false;
						// 		// $ngEL('#progress-bar').css('background', '#'+$scope.configuration.color);
						// 		// $scope.configuration.isLive = false;
						// 	}
						// } 

						if ( $scope.isMobile ) { // Hide the mute button if we're on mobile
							$ngEL( '.revolume' ).hide();

							$ngEL( '#fastForward-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );

							$ngEL( '#pause-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );

							$ngEL( '#rewind-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );

							$ngEL( '#play-pause-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );

							//css('background-color', '#'+$scope.configuration.color);
							$ngEL( '#play-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );

							//css('background-color', '#'+$scope.configuration.color);
							$ngEL( '#bitrate-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									// $(this).css('background-color', '');	
								} );
							$ngEL( '#fullscreen-btn' ).bind( 'touchstart', function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );


						} else {
							$ngEL( '#mute-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );
							$ngEL( '#fastForward-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );

							$ngEL( '#pause-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );

							$ngEL( '#rewind-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );

							$ngEL( '#play-pause-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );

							//css('background-color', '#'+$scope.configuration.color);
							$ngEL( '#play-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );

							//css('background-color', '#'+$scope.configuration.color);
							$ngEL( '#bitrate-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );
							$ngEL( '#fullscreen-btn' ).hover( function() {
									$( this ).css( 'background-color', '#' + $scope.configuration.color );
								},
								function() {
									$( this ).css( 'background-color', '' );
								} );
						}

						$scope.playerRef.addEventListener( 'webkitendfullscreen', function( event ) {
							setTimeout( function() {
								// console.log('Fullscreen is done exiting');
								if ( $scope.playerRef.paused ) {
									$scope.playPause = 'paused';
								} else {
									$scope.playPause = 'playing';
								}
							}, 500 );
						}, false );

						this.setSize = function( event, value ) {
							$element.css( 'z-index', 1000 );
						};

						$scope.$on( PlayerModule.PlayerAPI.RESIZE_EVENT, this.setSize );
					}
				} );
			}
		};
	}
] );
var VControlbarModule = angular.module( 'REPlayer.VControlbarModule', [] );

VControlbarModule.controller( 'VControlbarCtrl', [ '$window', '$scope', 'PlayerAPI',
	function( $window, $scope, playerAPI ) {

		$scope.panelBtns = {};
		//======== Declarations ========
		$scope.videoTitle = '';
		$scope.socialTitle = '';
		$scope.shareTimeEnabled = false;
		$scope.referralURL = '';
		$scope.shareTargets = '';
		$scope.videoDescription = '';
		$scope.embedCode = '';
		$scope.startTime = '';
		$scope.bgColor = '';
		$scope.defaultWidth = undefined;
		$scope.defaultHeight = undefined;
		$scope.vBarVisible = 'hidden';

		$scope.shareAtCurrentTime = 'false';

		$scope.ccEnabled = false;
		$scope.ccAvailable = true;

		$scope.pipAvailable = false;

		$scope.selectedID = '';

		$scope.$watch( 'configuration', function() {
			if ( $scope.configuration ) {
				$scope.videoTitle = $scope.configuration.title;
				$scope.socialTitle = $scope.configuration.socialTitle;
				$scope.referralURL = $scope.configuration.referralURL;
				$scope.shareTargets = $scope.configuration.shareTargets;
				$scope.videoDescription = $scope.configuration.description;
				$scope.embedCode = $scope.configuration.embedCode;
				$scope.startTime = $scope.configuration.startTime;
				$scope.shareTimeEnabled = $scope.configuration.shareTimeEnabled;
				$scope.sources = $scope.configuration.sources;
				$scope.defaultWidth = $scope.configuration.defaultWidth;
				$scope.defaultHeight = $scope.configuration.defaultHeight;
				$scope.bgColor = '#' + $scope.configuration.color;

				if ( $scope.configuration.showDescription ) {
					$scope.panelBtns[ "info" ] = {
						name: "info",
						id: "info-btn",
						selected: false,
						bgColor: ''
					};
				}
				if ( $scope.configuration.embed ) {
					$scope.panelBtns[ "embed" ] = {
						name: "embed",
						id: "embed-btn",
						selected: false,
						bgColor: ''
					};
				}
				if ( $scope.configuration.share ) {
					$scope.panelBtns[ "share" ] = {
						name: "share",
						id: "share-btn",
						selected: false,
						bgColor: ''
					};
				}
				if ( $scope.configuration.pipEnabled ) {
					$scope.panelBtns[ "pip" ] = {
						name: "pip",
						id: "pip-btn",
						selected: false,
						bgColor: ''
					};
				}
				if ( $scope.configuration.ccEnabled ) {
					$scope.panelBtns[ "cc" ] = {
						name: 'cc',
						id: 'cc-btn',
						selected: false,
						bgColor: ''
					};
				}

				//set flags for template
				for ( var i = 0; i < $scope.sources.length; i++ ) {
					$scope.sources[ i ].activeMain = false;
					$scope.sources[ i ].activePIP = false;
				};
			}
		} );


		$scope.onTogglePanel = function( btn ) {

			angular.forEach( $scope.panelBtns, function( value, key ) {
				if ( btn.name === key && !btn.selected ) {
					value.selected = true;
					value.bgColor = $scope.bgColor;
				} else if ( btn.selected && btn.name === 'cc' && btn.name === key ) {
					value.selected = false;
					value.bgColor = '';
				} else if ( value.name !== 'cc' && btn.name !== 'cc' ) {
					value.selected = false;
					value.bgColor = '';
				}
			} );

			if ( btn.name === 'cc' ) {
				if ( $scope.ccAvailable ) {
					playerAPI.toggleCC();
				}
			} else {
				//Need to access config object in case the dimensions have been changed outside this class
				if ( btn.selected ) {
					playerAPI.setSize( {
						width: $scope.configuration.defaultWidth - 170,
						height: $scope.configuration.defaultHeight - 0
					} );
				} else {
					playerAPI.setSize( {
						width: $scope.configuration.defaultWidth,
						height: $scope.configuration.defaultHeight
					} );
				}
			}
		};

		$scope.onShareClick = function( shareTargetURL ) {
			var shareURL = $scope.referralURL;
			//Add optional param for share at current time
			var configStartTime = $scope.startTime;
			if ( $scope.shareAtCurrentTime === 'true' || ( configStartTime && configStartTime !== '00:00:00' && configStartTime !== '' ) ) {

				//Prep the shareURL to have start time appended
				if ( shareURL.indexOf( '?' ) > 0 ) {
					shareURL += encodeURIComponent( '&' );
				} else {
					shareURL += encodeURIComponent( '?' );
				}

				var shareStartTime = 0;
				if ( $scope.shareAtCurrentTime === 'true' ) {
					//Get the share time from the current player time
					var currentTime = Math.floor( playerAPI.getCurrentTime() );
					if ( currentTime === undefined ) {
						currentTime = 0;
					}
					shareStartTime = currentTime;
				} else {
					if ( configStartTime.indexOf( ':' ) > 0 ) {
						//Translate timecode to seconds
						var times = configStartTime.split( ':' );
						configStartTime = 3600 * parseInt( times[ 0 ] );
						configStartTime += 60 * parseInt( times[ 1 ] );
						configStartTime += parseInt( times[ 2 ] );
					} else {
						//Assume we're getting seconds
						configStartTime = parseInt( configStartTime );
					}

					//Get it from the beginning (if specified more than 0 in config or URL)
					shareStartTime = configStartTime
				}

				//The #/ messes up URL params appended to the URL
				if ( shareURL.indexOf( '#/' ) >= 0 ) {
					shareURL = shareURL.replace( '#/', '' );
				}

				if ( $scope.shareTimeEnabled ) {
					shareURL += 'st=' + shareStartTime;
				}

			}

			var url = shareTargetURL.replace( '{url}', shareURL );
			url = url.replace( '{title}', $scope.videoTitle );
			url = url.replace( '{summary}', $scope.videoDescription );

			//TODO: see if we can use $location to do this
			var win = window.open( url, '_blank' );
			win.focus();
		};

		$scope.onCCAvailableChange = function( ccAvailable ) {
			$scope.ccAvailable = ccAvailable;

			if ( $scope.configuration.ccEnabled ) {
				$scope.panelBtns[ "cc" ] = {
					name: 'cc',
					id: 'cc-btn',
					selected: false,
					bgColor: ''
				};
			}

			addCCBtn();
		}

		// =================================
		// Listeners
		// =================================

		$scope.$on( PlayerModule.PlayerAPI.CC_ENABLED_CHANGE_EVENT, function( event, ccEnabled ) {
			$scope.ccEnabled = ccEnabled;
		} );

		var addCCBtn = $scope.$on( PlayerModule.PlayerAPI.CC_AVAILABLE_CHANGE_EVENT, function( event, ccAvailable ) {
			$scope.onCCAvailableChange( $scope.ccAvailable );
		} );

		var addPIPBtn = $scope.$on( PlayerModule.PlayerAPI.PIP_AVAILABE_CHANGE_EVENT, function( event, pipAvailable ) {
			$scope.pipAvailable = pipAvailable;
			addPIPBtn();
		} );

		if ( playerAPI.getPlayerType() === PlayerModule.PlayerAPI.TYPE_FLASH_PLAYER ) {
			$scope.onCCAvailableChange( true );
		}
	}
] );

VControlbarModule.controller( 'PipControlCtrl', [ '$scope', 'PlayerAPI',
	function( $scope, playerAPI ) {

		$scope.showPIPControls = false;
		if ( playerAPI.getPlayerType() === PlayerModule.PlayerAPI.TYPE_FLASH_PLAYER ) {
			$scope.showPIPControls = true;
		}

		$scope.showPIP = false;
		$scope.main = undefined;
		$scope.pip = undefined;


		$scope.onClickEnablePIP = function() {
			$scope.showPIP = !$scope.showPIP;

			if ( $scope.showPIP ) {
				var playPIP;
				if ( !$scope.pip ) {
					playPIP = $scope._getFirstAltStream( $scope.sources );
				} else if ( $scope.pip ) {
					playPIP = $scope.pip;
				}

				$scope._playFileInPIP( playPIP );
				playerAPI.playFileInPIP( playPIP );
			} else {
				$scope.pip.activePIP = false;
				$scope.pip.activeMain = false;

				$scope.sources = $scope._updateByName( $scope.sources, $scope.pip );
			}

			playerAPI.togglePIP( $scope.showPIP );
		};

		$scope.onClickMain = function( source ) {
			var newName = source.name;
			var currentName = $scope.main.name;
			if ( $scope.pip ) {
				var pipName = $scope.pip.name;
			}
			if ( currentName !== newName ) {
				$scope.main.activeMain = false;
				if ( $scope.showPIP && source.name === pipName ) {
					$scope._playFileInPIP( $scope.main );
					$scope._playFileInMain( source );
					playerAPI.swapPIPAndMain();
				} else {
					$scope._playFileInMain( source );
					playerAPI.playFileInMain( source );
				}
			}
		};

		$scope._playFileInMain = function( source ) {
			source.activeMain = true;
			source.activePIP = false;
			$scope.main = source;

			$scope.sources = $scope._updateByName( $scope.sources, $scope.main );
		}

		$scope._playFileInPIP = function( source ) {
			source.activePIP = true;
			source.activeMain = false;
			$scope.pip = source;

			$scope.sources = $scope._updateByName( $scope.sources, $scope.pip );
		}

		$scope.onClickPIP = function( source ) {
			var newName = source.name;
			if ( $scope.pip ) {
				var currentName = $scope.pip.name;
			}
			if ( $scope.main ) {
				var mainName = $scope.main.name;
			}
			if ( !currentName && mainName !== newName || currentName ) {
				if ( currentName !== newName ) {
					if ( $scope.pip ) {
						$scope.pip.activePIP = false;
					}
					if ( !$scope.showPIP ) {
						$scope.showPIP = true;
						playerAPI.togglePIP( $scope.showPIP );
					}

					if ( source.name === mainName ) {
						if ( $scope.pip ) {
							$scope._playFileInMain( $scope.pip );
						}
						$scope._playFileInPIP( source );
						playerAPI.swapPIPAndMain();
					} else {

						$scope._playFileInPIP( source )
						playerAPI.playFileInPIP( source )
					}
				}
			}
		};

		$scope.onFlashSwapPIP = function() {
			var newPIP = $scope.main;
			var newMain = $scope.pip;

			$scope._playFileInPIP( newPIP );
			$scope._playFileInMain( newMain );
		}

		$scope._getFirstAltStream = function( streams ) {
			if ( streams ) {
				for ( var i = 0; i < streams.length; i++ ) {
					if ( !streams[ i ].main ) {
						return streams[ i ];
					}
				}
			}

			return null;
		};

		$scope._findByName = function( name, streams ) {
			for ( var i = 0; i < streams.length; i++ ) {
				if ( streams[ i ].name === name ) {
					return streams[ i ];
				}
			}
		};

		$scope._updateByName = function( streams, stream ) {
			for ( var i = 0; i < streams.length; i++ ) {
				if ( streams[ i ].name === stream.name ) {
					streams[ i ] = stream;
				}
			}
			return streams;
		};

		$scope._getMain = function( streams ) {
			var main;
			if ( streams ) {
				for ( var i = 0; i < streams.length; i++ ) {
					if ( streams[ i ].main ) {
						main = streams[ i ];
						break;
					}
				}
			}

			if ( main ) {
				main.activeMain = true;
			}

			return main;
		};

		$scope._createMain = function( streams, url ) {
			var main = {};
			main.name = 'Main';
			main.url = url;
			main.main = 1;
			main.type = "";
			main.sync = 0;


			streams.push( main );
			return streams;
		};

		this.onSourcesChanged = function( sources ) {
			if ( $scope.sources && $scope.sources.length ) {
				$scope.main = $scope._getMain( $scope.sources );

				if ( !$scope.main ) {
					var url = $scope.configuration.source;
					if ( !$scope.showPIPControls && $scope.configuration.html5URL ) { //HTML
						url = $scope.configuration.html5URL;
					}
					$scope.sources = $scope._createMain( $scope.sources, url );
				}
			}
		};

		$scope.$watch( 'sources', this.onSourcesChanged );

		$scope.$on( PlayerModule.PlayerAPI.PIP_SWAP_CHANGE_EVENT, $scope.onFlashSwapPIP );

		this.onSourcesChanged( $scope.sources );


	}
] );

VControlbarModule.directive( 'vControlBar', [ 'PlayerAPI', '$timeout',
	function( playerAPI, $timeout ) {
		return {

			controller: 'VControlbarCtrl',
			restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			templateUrl: 'templates/player/html/vcontrolbar.tpl.html',
			replace: true,
			link: function( $scope, $element, $attr, controller ) {
				$scope.$watch( 'configuration', function() {
					if ( $scope.configuration ) {

						if ( $scope.configuration.embed || $scope.configuration.showDescription || $scope.configuration.share || $scope.configuration.ccEnabled ) {
							$scope.vBarVisible = 'show';
						} else {
							$scope.vBarVisible = 'hidden';
							$ngEL( '#control-bar' ).css( 'margin-right', 'auto' );
							$ngEL( '#flash-content-container' ).css( 'width', $scope.configuration.defaultWidth );
						};

						//Hover methods for btns
						$ngEL( '#info-btn' ).hover( function() {
								$( this ).css( 'background-color', '#' + $scope.configuration.color );
							},
							function() {
								if ( !$( this ).hasClass( 'selected' ) ) {
									$( this ).css( 'background-color', '' );
								};
							} );

						$ngEL( '#embed-btn' ).hover( function() {
								$( this ).css( 'background-color', '#' + $scope.configuration.color );
							},
							function() {
								if ( !$( this ).hasClass( 'selected' ) ) {
									$( this ).css( 'background-color', '' );
								};
							} );

						$ngEL( '#share-btn' ).hover( function() {
								$( this ).css( 'background-color', '#' + $scope.configuration.color );
							},
							function() {
								if ( !$( this ).hasClass( 'selected' ) ) {
									$( this ).css( 'background-color', '' );
								};
							} );

						$ngEL( '#cc-btn' ).hover( function() {
								$( this ).css( 'background-color', '#' + $scope.configuration.color );
							},
							function() {
								if ( !$( this ).hasClass( 'selected' ) ) {
									$( this ).css( 'background-color', '' );
								};
							} );
					}
				} );

				$scope.updatePIP = function( pipAvailable ) {
					console.log( 'pipAvailable changed', pipAvailable );
					var pipBtn = $element.find( '#pip-btn' );
					if ( pipAvailable ) {
						pipBtn.addClass( 'pipAvailable' );
					} else {
						if ( pipBtn.hasClass( 'pipAvailable' ) ) {
							pipBtn.removeClass( 'pipAvailable' )
						}
					}
				}

				$scope.$watch( 'pipAvailable', function( pipAvailable ) {
					$timeout( function() {
						$scope.updatePIP( pipAvailable );
					}, 100 );
				} );

				$scope.updateCC = function( ccAvailable ) {
					console.log( 'ccAvailable changed', ccAvailable );
					var ccBtn = $ngEL( $element ).find( '#cc-btn' );
					if ( ccAvailable ) {
						ccBtn.addClass( 'ccAvailable' );
					} else {
						if ( ccBtn.hasClass( 'ccAvailable' ) ) {
							ccBtn.removeClass( 'ccAvailable' )
						}
					}
				}

				$scope.$watch( 'ccAvailable', function( ccAvailable ) {
					$timeout( function() {
						$scope.updateCC( ccAvailable )
					}, 100 );
				} );

				$scope.$watch( 'panelBtns', function() {
					$timeout( function() {
						$scope.updateCC( $scope.ccAvailable );
						$scope.updatePIP( $scope.pipAvailable );
					}, 100 );
				} );
			}
		};
	}
] );

VControlbarModule.directive( 'pipControlPanel', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			controller: 'PipControlCtrl',
			restrict: 'E',
			templateUrl: 'templates/player/html/vcontrolbarpanels/pip-controls.tpl.html',
			replace: true,
			link: function( $scope, $element, $attr ) {}
		};

	}
] );

VControlbarModule.directive( 'sharePanel', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			//controller: 'PipControlCtrl',
			restrict: 'E',
			templateUrl: 'templates/player/html/vcontrolbarpanels/share-panel.tpl.html',
			replace: true,
			link: function( $scope, $element, $attr ) {}
		};
	}
] );

VControlbarModule.directive( 'embedPanel', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			//controller: 'PipControlCtrl',
			restrict: 'E',
			templateUrl: 'templates/player/html/vcontrolbarpanels/embed-panel.tpl.html',
			replace: true,
			link: function( $scope, $element, $attr ) {}
		};
	}
] );

VControlbarModule.directive( 'infoPanel', [ 'PlayerAPI',
	function( playerAPI ) {
		return {
			//controller: 'PipControlCtrl',
			restrict: 'E',
			templateUrl: 'templates/player/html/vcontrolbarpanels/info-panel.tpl.html',
			replace: true,
			link: function( $scope, $element, $attr ) {}
		};
	}
] );
var QOSPanelModule = angular.module('REPlayer.QOSPanelModule', []);

QOSPanelModule.controller('QOSPanelCtrl', 
	['$scope', '$element', '$attrs', 'PlayerAPI',
	function($scope, $element, $attrs, playerAPI) {
		$scope.duration = playerAPI.getDuration() || 0;
		$scope.currentTime = playerAPI.getCurrentTime() || 0;
		$scope.qosPlaying = playerAPI.getPaused() ? 'YES':'NO';
		
		$scope.$on(PlayerModule.PlayerAPI.TIME_UPDATE_EVENT, function(event, currentTime) {
			$scope.currentTime = currentTime || 0;
		}, false);
		
		$scope.$on(PlayerModule.PlayerAPI.DURATION_CHANGE_EVENT, function(event, duration) {
			$scope.duration = duration || 0;
		}, false);
		
		$scope.$on(PlayerModule.PlayerAPI.PAUSED_EVENT, function(event, paused) {
			$scope.qosPlaying = paused ? 'YES':'NO';
		}, false);
		
		$scope.$on(PlayerModule.PlayerAPI.STATE_CHANGE_EVENT, function(event, state) {
			$scope.qosPlaying = state === PlayerModule.PlayerAPI.STATE_PLAYING ? 'YES':'NO';
		}, false);
	}
]);

QOSPanelModule.directive('qosPanel', [function() {
	return {
		// name: '',
		// priority: 1,
		// terminal: true,
		//scope: {}, // {} = isolate, true = child, false/undefined = no change
		controller: 'QOSPanelCtrl',
		// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
		restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
		// template: '',
		templateUrl: 'templates/qospanel/qos-panel.tpl.html',
		replace: true,
		// transclude: true,
		// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
		link: function($scope, $element, $attr, controller) {
		
		}
	};
}]);