/*! ATTMasters - 
* version: 0.0.1 
* build:  
* rev:  
* 2014-03-03
* http://realeyes.com/replayer
* Copyright (c) 2014 RealEyes Media; Licensed RealEyes */
var ATTMasters = angular.module( 'ATTMasters', [ 'ngRoute', 'ATTMaster.TabPanelModule', 'ATTMaster.TabBarModule', 'ATTMaster.PerfectScrollbar', 'ATTMaster.StaticAdModule', 'ATTMaster.YahooFeedModule', 'ATTMaster.SocialComponentModule' ] )
	.config( [ '$routeProvider', '$locationProvider', '$httpProvider',
		function( $routeProvider, $locationProvider, $httpProvider ) {
			console.log( 'WRAPPER VERSION', wrapperVersion );

			$routeProvider
				.when( '/desktop', {
					template: 'desktop'
				} )
				.when( '/vTablet', {
					template: 'vTablet'
				} )
				.when( '/vtablet', {
					template: 'vTablet'
				} )
				.when( '/hTablet', {
					template: 'hTablet'
				} )
				.when( '/htablet', {
					template: 'hTablet'
				} )
				.when( '/phone', {
					template: 'phone'
				} )
				.otherwise( {
					template: 'wrapper'
				} );;
		}
	] )
	.run( [ '$rootScope', 'MastersService',
		function( $rootScope, service ) {

			//=== MODULE INITIALIZATION ===
			$rootScope.BIOS_CHANGE = 'biosChange';
			$rootScope.LEADERBOARD_CHANGE = 'leaderboardChange';
			$rootScope.PAIRINGS_CHANGE = 'pairingsChange';
			$rootScope.SCHEDULE_CHANGE = 'scheduleChange';
			$rootScope.YAHOO_FEED_CHANGE = 'yahooFeedChange';
			$rootScope.YAHOO_FEED_ERROR = 'yahooFeedError';

			$rootScope.BREAKPOINT_CHANGE = 'breakpointChange';
			$rootScope.ORIENTATION_CHANGE = 'orientationChange';

			$rootScope.config = window.attMastersConfig;

			$rootScope.playerBios = undefined;
			$rootScope.leaderboard = undefined;
			$rootScope.lastLeaderboard = undefined;
			$rootScope.schedule = undefined;
			$rootScope.pairings = undefined;
			$rootScope.yahooFeed = undefined;

			$rootScope.TabIDs = {
				SCHEDULE: 'schedule',
				PAIRINGS: 'pairings',
				BIOS: 'bios',
				LEADERBOARD: 'leaderboard'
			};

			$rootScope.playerLookup = undefined;

			//Breakpoint ID to reference. Should match up with the ID of an object on Breakpoints
			$rootScope.breakpoint = undefined;

			$rootScope.Breakpoints = $rootScope.config.breakpoints;

			$rootScope.isMobile = {
				android: function() {
					return navigator.userAgent.match( /Android/i );
				},
				blackBerry: function() {
					return navigator.userAgent.match( /BlackBerry/i );
				},
				iOS: function() {
					return navigator.userAgent.match( /iPhone|iPad|iPod/i );
				},
				opera: function() {
					return navigator.userAgent.match( /Opera Mini/i );
				},
				windows: function() {
					return navigator.userAgent.match( /IEMobile/i );
				},
				any: function() {
					return ( $rootScope.isMobile.android() ||
						$rootScope.isMobile.blackBerry() ||
						$rootScope.isMobile.iOS() ||
						$rootScope.isMobile.opera() ||
						$rootScope.isMobile.windows() );
				}
			};

			$rootScope.isMobileOS = $rootScope.isMobile.any();
			$rootScope.isIOS = $rootScope.isMobile.iOS();
		}
	] )
	.controller( 'MastersCtrl', [ '$rootScope', '$scope', '$route', '$timeout', "MastersService",
		function( $rootScope, $scope, $route, $timeout, service ) {

			//=== DECLARATIONS ===
			$scope.adProvider = $rootScope.config.ad;
			$scope.orientation = window.orientation;
			$scope.window = angular.element( window );
			$scope.orientationEvent = Boolean( "onorientationchange" in window ) ? "orientationchange" : "resize";
			$scope.defaultBreakpoint = 'wrapper';
			$scope.placeholderSource = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			if ( $rootScope.config.inactiveSlate && $rootScope.config.inactiveSlate !== '' ) {
				$scope.placeholderSource = $rootScope.config.inactiveSlate;
			}

			//=== CONTROL ===
			$scope.checkOrientation = function( windowInfo ) {
				if ( $rootScope.isMobileOS ) {
					if ( !windowInfo ) {
						var currentOrientation = $scope.orientation;
						if ( !$rootScope.isIOS && $scope.orientationEvent === 'resize' ) {
							if ( screen && screen.width ) {
								if ( screen.width > screen.height ) {
									$scope.orientation = 90;
								} else {
									$scope.orientation = 0;
								}
							}
						} else {
							$scope.orientation = window.orientation;
						}
					} else {
						if ( $rootScope.isMobileOS && $rootScope.isIOS ) {
							if ( windowInfo.orientation <= 90 ) {
								$scope.orientation = windowInfo.orientation;
							} else {
								$scope.orientation = 0;
							}
						} else if ( $rootScope.isMobileOS && !$rootScope.isIOS ) {
							$scope.orientation = abs( windowInfo.orientation - 90 );
							// alert('Hey hey, Android rotation!');
						}
					}

					//Update the breakpoint data
					var tabletBreakpoint = $rootScope.Breakpoints.VTABLET;
					if ( screen.width > tabletBreakpoint.minWidth && $scope.orientation === tabletBreakpoint.orientation ) {
						if ( $rootScope.isMobile.android() ) {
							if ( screen.width > screen.height ) {
								$rootScope.breakpoint = $rootScope.Breakpoints.HTABLET.id;
							} else {
								$rootScope.breakpoint = tabletBreakpoint.id;
							}
						} else {
							$rootScope.breakpoint = tabletBreakpoint.id;
						}
					} else if ( screen.width > tabletBreakpoint.minWidth ) {
						$rootScope.breakpoint = $rootScope.Breakpoints.HTABLET.id;
					}

					if ( currentOrientation !== $scope.orientation ) {
						$rootScope.$broadcast( $rootScope.ORIENTATION_CHANGE, $scope.orientation );
						breakpointToPage();
					}

					window.isPhone = $rootScope.breakpoint === $rootScope.Breakpoints.PHONE.id;

					$rootScope.$broadcast( $rootScope.BREAKPOINT_CHANGE, $rootScope.breakpoint );
				}
			}

			//=== LISTENERS ===
			$rootScope.$on( '$routeChangeSuccess', function( event, current, previous, resolve ) {

				//If a non-default template (breakpoint) was specified in the route, use that. Otherwise choose by capabilities
				if ( current.template !== undefined && current.template !== $scope.defaultBreakpoint ) {
					$rootScope.breakpoint = current.template;
					breakpointToPage()
				} else {
					if ( !$rootScope.isMobileOS ) {
						$rootScope.breakpoint = $rootScope.Breakpoints.DESKTOP.id;
					} else if ( screen && screen.width > $rootScope.Breakpoints.VTABLET.minWidth ) {
						$scope.checkOrientation();
					} else {
						if ( screen && screen.width > 320 ) {
							$rootScope.breakpoint = $rootScope.Breakpoints.PHONE.id;
						} else {
							$rootScope.breakpoint = $rootScope.Breakpoints.PHONE.id;
						}
					}
					breakpointToPage();
				}

				window.isPhone = $rootScope.breakpoint === $rootScope.Breakpoints.PHONE.id;

				$rootScope.$broadcast( $rootScope.BREAKPOINT_CHANGE, $rootScope.breakpoint );
			} );

			$scope.window.on( $scope.orientationEvent, function( event ) {
				$scope.checkOrientation();
			} );

			function breakpointToPage() {
				var fbp = $rootScope.breakpoint;
				var frameHeight = $rootScope.Breakpoints[ fbp.toUpperCase() ].frameHeight;
				var frameWidth = $rootScope.Breakpoints[ fbp.toUpperCase() ].frameWidth;
				if ( frameWidth !== undefined && frameHeight !== undefined && parent.frameBreakpoint ) {
					parent.frameBreakpoint( frameHeight, frameWidth );
				}
				// $scope.playerManipulator(fbp);
				playerManipulator();
			}

			function playerManipulator() {
				if ( window.playerRef ) {
					var rePlayer = angular.element( document ).find( '#replayer' );
					var htmlPlayer = angular.element( document ).find( '#html-player' );
					var controlBar = angular.element( document ).find( '#control-bar' );
					var vControl = angular.element( document ).find( '#vert-control-bar' );
					var playButton = angular.element( document ).find( '#play-btn-overlay' );
					var placeholder = angular.element( document ).find( '#player-placeholder' );
					var placeholderImg = angular.element( document ).find( '#placeholder-image' );
					var playerContainer = angular.element( document ).find( '#player-container' );

					if ( $rootScope.breakpoint === 'hTablet' || $rootScope.breakpoint === 'vTablet' ) {
						if ( $rootScope.breakpoint === 'hTablet' ) {


							if ( vControl.width > 50 ) {
								window.api.setSize( {
									width: 636 - 170,
									height: 384,
									setDefaults: true
								} );
							} else {
								window.api.setSize( {
									width: 636,
									height: 384,
									setDefaults: true
								} );
							}
							rePlayer.css( 'height', '384px' );
							rePlayer.css( 'width', '682px' );
							htmlPlayer.css( 'height', '384px' );
							htmlPlayer.css( 'width', '636px' );
							controlBar.css( 'width', '636px' );
							vControl.css( 'right', '0px' );
							vControl.css( 'height', '384px' )
							playButton.css( 'left', '301px' );
							playButton.css( 'top', '127px' );
							playerContainer.css( 'top', placeholder.offset().top );
							playerContainer.css( 'left', placeholder.offset().left );
						} else {

							if ( vControl.width > 50 ) {
								window.api.setSize( {
									width: 912 - 170,
									height: 513,
									setDefaults: true
								} );
							} else {
								window.api.setSize( {
									width: 912,
									height: 513,
									setDefaults: true
								} );
							}

							rePlayer.css( 'height', '513px' );
							rePlayer.css( 'width', '960px' );
							htmlPlayer.css( 'height', '513px' );
							htmlPlayer.css( 'width', '912px' );
							controlBar.css( 'width', '912px' );
							vControl.css( 'height', '513px' );
							vControl.css( 'right', '2px' );
							playButton.css( 'left', '416px' );
							playButton.css( 'top', '192px' );
							playerContainer.css( 'top', placeholder.offset().top );
							playerContainer.css( 'left', 0 );
						}

					} else if ( $rootScope.breakpoint === 'desktop' ) {
						playerContainer.css( 'top', placeholder.offset().top );
						playerContainer.css( 'left', placeholder.offset().left );
					} else if ( $rootScope.breakpoint === 'phone' ) {
						window.api.setSize( {
							width: 320,
							height: 180,
							setDefaults: true
						} );
						rePlayer.css( 'width', '320px' );
						rePlayer.css( 'height', '180px' );
						htmlPlayer.css( 'width', '320px' );
						htmlPlayer.css( 'height', '180px' );
						htmlPlayer.css( 'background-color', 'rgba(0,0,0,0)' );
						playButton.css( 'top', '62px' );
						playButton.css( 'left', '146px' );
						playButton.css( 'height', '60px' );
						playButton.css( 'width', '80px' );
						playButton.css( 'background-size', '60%' );
						playButton.css( 'background-repeat', 'no-repeat' );
						placeholder.css( 'height', '180px' );
						placeholder.css( 'width', '320px' );
						placeholderImg.css( 'height', '180px' );
						placeholderImg.css( 'width', '320px' );
						vControl.css( 'height', '80px' )
						playerContainer.css( 'top', placeholder.offset().top );
						playerContainer.css( 'left', placeholder.offset().left );
					}
				} else {
					console.log( '$$$$$ - No player yet, waiting...' );
					checkForPlayer();
				}
			}

			function checkForPlayer() {
				$timeout( function() {
					if ( window.playerRef ) {
						playerManipulator();
					} else {
						checkForPlayer();
					}
				}, 500 );
			}

			function orientationListener( event ) {
				if ( event.origin !== $rootScope.config.pageDomain ) {
					return;
				} else {
					var windowInfo = event.data;
					/ /
					console.log( 'got orientation data, calling $scope.checkOrientation', windowInfo );
					// alert('got orientation data, orientation is ' + windowInfo.orientation +
					// 			' innerHeight is ' + windowInfo.innerHeight +
					// 			' innerWidth is ' + windowInfo.innerWidth +
					// 			' outerHeight is ' + windowInfo.outerHeight +
					// 			' outerWidth is ' + windowInfo.outerWidth +
					// 			' screenHeight is ' + windowInfo.screenHeight +
					// 			' screenWidth is ' + windowInfo.screenWidth );
					$scope.checkOrientation( windowInfo );
				}
			}

			if ( parent.mastersFrameLoaded !== undefined ) {
				if ( window.addEventListener ) {
					addEventListener( "message", orientationListener, false );
					parent.mastersFrameLoaded();
				} else {
					attachEvent( "onmessage", orientationListener );
					parent.mastersFrameLoaded();
				}
			}
		}
	] )
	.directive( 'attWrapper', function() {
		return {
			restrict: 'E',
			templateUrl: 'templates/wrapper/wrapper.tpl.html',
			replace: true,
			scope: 'isolate',
			controller: 'MastersCtrl',
			link: function( scope, element, attrs ) {

			}
		}
	} );
ATTMasters
	.factory( 'MastersService', [ '$http', '$q', '$rootScope', '$timeout', 'MastersTranslator', 'MastersFormatter', 
		function( $http, $q, $rootScope, $timeout, translator, formatter ) {
			return {
				getPlayerBios: function() {
					$http.get( $rootScope.config.services.biosService )
						.success( function( data, status, headers, config ){
							//parse and translate
							var resultAsJSON = xmltoJSON.parseXML( parseXml( data ) );
							var playerBios = translator.translatePlayerBios( resultAsJSON );
							
							//Store players by id in a dict for easy lookup
							$rootScope.playerLookup = {};
							var numPlayers = playerBios.length;
							for( var i = 0; i < numPlayers; i++ ) {
								var player = playerBios[i];
								$rootScope.playerLookup[ player.id ] = player;
							}

							//Set the array on the model and let the world know
							$rootScope.playerBios = playerBios;
							$rootScope.$broadcast( $rootScope.BIOS_CHANGE, $rootScope.playerBios );
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! bios service error', data );
						});
				},

				getLeaderboard: function() {
					var self = this;
					$http.get( $rootScope.config.services.leaderboardService )
						.success( function( data, status, headers, config ){
							
							//parse and translate, only if different from previous leaderboard
							if( data !== $rootScope.lastLeaderboard ) {
								$rootScope.lastLeaderboard = data;
								var resultAsJSON = xmltoJSON.parseXML( parseXml( data ) );
								var leaderboard = translator.translateScores( resultAsJSON );
								leaderboard = leaderboard.sort( formatter.sortLeaderboard );

								//Set the array on the model and let the world know
								$rootScope.leaderboard = leaderboard;
								$rootScope.$broadcast( $rootScope.LEADERBOARD_CHANGE, $rootScope.leaderboard );
							}

							if( $rootScope.config.services.leaderboardInterval > 0 ) {
								self.pollLeaderboard();
							}
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! leaderboard service error', data );
							if( $rootScope.config.services.leaderboardInterval > 0 ) {
								self.pollLeaderboard();
							}
						});
				},

				pollLeaderboard: function() {
					var self = this;
					var services = $rootScope.config.services;
					if( services.leaderboardPoll ) {
						$timeout.cancel( services.leaderboardPoll );
					}

					services.leaderboardPoll = $timeout( function() {
							self.getLeaderboard()
						}, services.leaderboardInterval );
				},

				getPairings: function() {
					$http.get( $rootScope.config.services.pairingsService )
						.success( function( data, status, headers, config ){
							$rootScope.pairings = translator.translatePairings( data );
							$rootScope.$broadcast( $rootScope.PAIRINGS_CHANGE, $rootScope.pairings );
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! pairings service error', data );
						});
				},

				getSchedule: function() {
					$http.get( $rootScope.config.services.scheduleService )
						.success( function( data, status, headers, config ){
							$rootScope.schedule = translator.translateSchedule( data );
							$rootScope.$broadcast( $rootScope.SCHEDULE_CHANGE, $rootScope.schedule );
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! schedule service error', data );
						});
				},

				getYahooGolfFeed: function() {
					//First construct a crossdomain URL for the feed using yql 
					var crossdomainURL = formatter.createCrossdomainYahooFeedURL( $rootScope.config.services.yahooService );
					
					//Make the call with the crossdomain URL
					$http.jsonp( crossdomainURL )
						.success( function( data, status, headers, config ){
							if( data.query && data.query.results ) {
								var resultAsJSON = data.query.results.item;
								var yahooFeed = translator.translateYahooFeed( resultAsJSON );
								yahooFeed = formatter.truncateArray( yahooFeed, $rootScope.config.yahooFeed.maxItems );
								yahooFeed = formatter.formatYahooFeed( yahooFeed );
								$rootScope.yahooFeed = yahooFeed;
								$rootScope.$broadcast( $rootScope.YAHOO_FEED_CHANGE, $rootScope.yahooFeed );
							} else {
								$rootScope.$broadcast( $rootScope.YAHOO_FEED_ERROR, data );
							}
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! yahoo service error', data, status, headers, config );
							$rootScope.$broadcast( $rootScope.YAHOO_FEED_ERROR, data );
						});
				},

				getExtraYahooGolfFeed: function() {
					//First construct a crossdomain URL for the feed using yql 
					var crossdomainURL = formatter.createCrossdomainYahooFeedURL( $rootScope.config.services.extraYahooService );

					//Make the call with the crossdomain URL
					$http.jsonp( crossdomainURL )
						.success( function( data, status, headers, config ){
							var resultAsJSON = data.query.results.item;
							var extraYahooFeed = translator.translateYahooFeed( resultAsJSON );
							extraYahooFeed = formatter.truncateArray( extraYahooFeed, $rootScope.config.yahooFeed.maxItems );
							var jointYahooFeed = $rootScope.yahooFeed.concat( extraYahooFeed );
							jointYahooFeed = formatter.formatYahooFeed( jointYahooFeed );
							$rootScope.yahooFeed = jointYahooFeed;
							$rootScope.$broadcast( $rootScope.YAHOO_FEED_CHANGE, $rootScope.yahooFeed );
						})
						.error( function( data, status, headers, config ){
							console.log( '!!! extra yahoo service error', data );
						});
				}
				

			};
	}])
	.factory( 'MastersTranslator', [ '$rootScope', 'MastersFormatter', 
		function( $rootScope, formatter ) {
			return {
				translatePlayerBios: function( biosJSON ) {
					var playerBios = [];
					var playersJSON = biosJSON.Items.Item;
					var numPlayers = playersJSON.length;
					for( var i = 0; i < numPlayers; i++ ) {
						playerBios.push( this.translatePlayerBio( playersJSON[i] ) );
					}

					return playerBios;
				},
				translatePlayerBio: function( bioJSON ) {
					var bio = {};
					bio.id = bioJSON.ExternalId;
					bio.firstName = bioJSON.FirstName;
					bio.lastName = bioJSON.LastName;
					bio.thumbnailURL = bioJSON.Image;
					bio.altThumbnailURL = bioJSON.DescriptionImage; //Seems to always be the same as Image

					var desc = bioJSON.Description;
					bio.country = desc.Country;
					bio.bestFinish = desc.BestFinish;
					bio.highlights = desc.Highlights;
					bio.birthdate = desc.Birthdate;

					return bio;
				},
				translateScores: function( scoresJSON ) {
					var leaderboard = [];
					var players = scoresJSON.Items.Item;
					if( players ){

						var len = players.length;
						for( var i = 0; i < len; i++ ) {
							//Create the base player object
							var playerJSON = players[i];
							var player = {
								id: playerJSON.ExternalId,
								name: playerJSON.Name
							};

							//Get the player position
							var desc = playerJSON.Description;
							player.position = desc.Position;
							if( typeof desc.Position === 'string' ) {
								//Making position be an int so we can sort it better
								if( isNaN( parseInt(desc.Position[0]) ) ) {
									player.positionNum = parseInt( desc.Position.substring( 1 ) );
								} else {
									player.positionNum = parseInt( desc.Position );
								}
							} else {
								player.positionNum = 999;
								player.position = "-";
							}
							
							if( typeof desc.Thru === 'string' ) {
								player.thru = desc.Thru;
							} else {
								player.thru = "-";
							}

							player.overallStatus = desc.OverallStatus;
							if( player.overallStatus.toUpperCase() === 'EVEN' ) {
								player.overallStatus = 'E';
							}
							player.overallStatusNum = formatter.formatLeaderboardStatusNum( player.overallStatus );

							player.todaysStatus = desc.TodaysStatus;
							player.todaysStatusNum = formatter.formatLeaderboardStatusNum( player.todaysStatus );

							//Get the total score by adding the score from each round
							var totalScore = 0;
							var roundsPlayed = 0;
							var rounds = desc.rounds.round;
							var numRounds = rounds.length;
							for( var j = 0; j < numRounds; j++ ) {
								var round = rounds[j];
								if( typeof round.totalScore === 'string' ) {
									totalScore += parseInt( round.totalScore );
									roundsPlayed ++;
								}
							}
							player.totalScore = totalScore;
							player.roundsPlayed = roundsPlayed;

							//Add the player to the collection
							leaderboard.push( player );
						}
					}
					return leaderboard;
				},
				translatePairings: function( pairingsJSON ) {
					var pairings = {};
					pairings.round1 = this.translatePairingsTab( pairingsJSON.round1, 'round1', "1" );
					pairings.round2 = this.translatePairingsTab( pairingsJSON.round2, 'round2', "2" );
					pairings.round3 = this.translatePairingsTab( pairingsJSON.round3, 'round3', "3" );
					pairings.round4 = this.translatePairingsTab( pairingsJSON.round4, 'round4', "4" );
					pairings.withdrawn = this.translateWithdrawnTab( pairingsJSON.withdrawn, 'withdrawn' );

					return pairings; 
				},
				translatePairingsTab: function( pairingsTabJSON, tabID, day ) {
					//Set defaults in case tab data is missing.
					var pairingsTab = pairingsTab = {
							id: tabID,
							label: "Round " + day,
							shortLabel: day,
							largestPairing: 0,
							active: false
					};

					if( pairingsTabJSON ) {
						//Override default with data, just in case.
						pairingsTab.label = "Round " + pairingsTabJSON.day;
						pairingsTab.shortLabel = pairingsTabJSON.day;
						
						var groups = [];
						if( pairingsTabJSON.group ) {
							var len = pairingsTabJSON.group.length;
							for( var i = 0; i < len; i++ ) {
								var group = this.translateGroup( pairingsTabJSON.group[i] );
								//Track how many players are in the largest group so we can layout the table appropriately
								if( group.numPlayers > pairingsTab.largestPairing ) {
									pairingsTab.largestPairing = group.numPlayers;
								}
								groups.push( group );
							}
						}
						pairingsTab.dataProvider = groups;
					}
					
					return pairingsTab;
				},
				translateGroup: function( groupJSON ) {
					var group = { 
						number: groupJSON.number,
						time: groupJSON.time,
						tee: groupJSON.tee,
						numPlayers: 0
					};

					var groupTime = group.time.substr( 0, group.time.lastIndexOf( ' ' ) );
					group.moment = moment( groupTime, 'h:mm A' );

					var players = [];
					var len = groupJSON.player.length;
					for( var i = 0; i < len; i++ ) {
						var player = this.translatePlayer( groupJSON.player[i] );
						if( player.id !== '' ){
							players.push( player );
							group.numPlayers ++;
						}
					}

					group.players = players;

					return group;
				},
				translatePlayer: function( playerJSON ) {
					//NOTE: only id and name should always be there. Other stats
					//depend on what service is used.
					var player = {
						id: playerJSON.id,
						name: playerJSON.name,

						country: playerJSON.nation,
						status: playerJSON.status,
						parTotal: playerJSON.par_total,
						total: playerJSON.total,
						round1: playerJSON.r1,
						round2: playerJSON.r2,
						round3: playerJSON.r3,
						round4: playerJSON.r4
					}

					return player;
				},
				translateWithdrawnTab: function( withdrawnTabJSON, tabID ) {
					var withdrawnTab = null;
					if( withdrawnTabJSON ) {
						withdrawnTab = {
							id: tabID,
							label: "Withdrawn",
							shortLabel: "W",
							largestPairing: 0
						};

						var players = [];
						var withdrawnPlayers = withdrawnTabJSON.player;
						var len = withdrawnPlayers.length;
						for( var i = 0; i < len; i++ ) {
							players.push( this.translatePlayer( withdrawnPlayers[i] ) );
						}
						withdrawnTab.dataProvider = players;
					}
					return withdrawnTab;
				},
				translateSchedule: function( scheduleJSON ) {
					var schedule = [];
					if( scheduleJSON ) {
						var len = scheduleJSON.days.length;
						for( var i = 0; i < len; i++ ) {
							schedule.push( this.translateDay( scheduleJSON.days[i] ));
						}
					}

					return schedule;
				},
				translateDay: function( dayJSON ) {
					var day = { 
						title: dayJSON.title,
						date: dayJSON.date
					};

					day.moment = moment( day.date, "YYYY-M-D" );

					day.categories = this.translateCategories( dayJSON.categories );

					return day;
				},
				translateCategories: function( categoryJSON ) {
					var categories = [];
					if( categoryJSON ) {
						var len = categoryJSON.length
						for( var i = 0; i < len; i++ ) {
							var category = { title: categoryJSON[i].title };
							var categoryEvents = categoryJSON[i].events;
							if( categoryEvents ) {
								var events = [];
								var numEvents = categoryEvents.length;
								for( var j = 0; j < numEvents; j++ ) {
									events.push( this.translateEvent( categoryEvents[j] ));
								}

								category.events = events;
							}

							categories.push( category );
						}
					}
					return categories;
				},
				translateEvent: function( eventJSON ){
					var eventObj = { 
						description: eventJSON.description,
						startTime: eventJSON.startTime,
						endTime: eventJSON.endTime 
					};
					return eventObj;
				},
				translateYahooFeed: function( yahooJSON ){
					var feedItems = [];
					var numItems = yahooJSON.length;
					for( var i = 0; i < numItems; i++ ) {
						feedItems.push( this.translateYahooItem( yahooJSON[i] ) );
					}

					return feedItems;
				},
				translateYahooItem: function( itemJSON ) {
					var item = {
						title: itemJSON.title,
						link: itemJSON.link,
						description: itemJSON.description,
						pubDate: itemJSON.pubDate,
						category: itemJSON.category,
						guid: itemJSON.guid
					};

					var truncatedPubDate = item.pubDate.substr( 0, item.pubDate.lastIndexOf( " " ) );
					var itemMoment = moment( truncatedPubDate, "ddd, DD MMM YYYY HH:mm:ss" );
					item.pubEpoch = itemMoment.valueOf();

					return item;
				},
				
			};
	}])
	.factory( "MastersFormatter", [ '$rootScope', 
		function( $rootScope ) {
			var formatterObj = {
				stripHTML: function( text ) {
					text = String(text).replace(/<[^>]+>/gm, '');
					return text;
				},
				truncateText: function( text, limit ) {
					if( text.length > limit ) {
						text = text.substr( 0, limit );
						text += '...';
					}
					return text;
				},
				truncateArray: function( array, limit ) {
					if( array.length > limit ) {
						array = array.slice( 0, limit );
					}
					return array;
				},
				createCrossdomainYahooFeedURL: function( url ) {
					var crossdomainURL = 'http://query.yahooapis.com/v1/public/yql?q=';
					crossdomainURL += encodeURIComponent('select * from rss where url=\"' + url + '\"');
					crossdomainURL += '&format=json&callback=JSON_CALLBACK';

					return crossdomainURL;
				},
				sortLeaderboard: function( playerA, playerB ) {
					var order = -1;
					if( playerA.positionNum === playerB.positionNum ) {
						if( playerA.positionNum === 999 ) {
							if( playerA.totalScore > playerB.totalScore ){
								order = 1;
							} else if( playerA.totalScore === playerB.totalScore ) {
								order = 0;
							}
						} else {
							if( playerA.todaysStatusNum > playerB.todaysStatusNum ) {
								order = 1;
							} else if( playerA.todaysStatusNum === playerB.todaysStatusNum ) {
								order = 0
							}
						}
					} else if( playerA.positionNum > playerB.positionNum ) {
						order = 1;
					}

					return order;
				},
				formatLeaderboardStatusNum: function( status ) {
					var statusNum = parseInt( status );
					if( status.toUpperCase() === 'E' ) {
						statusNum = 0;
					}
					return statusNum;
				}
			};

			formatterObj.formatYahooFeed = function( yahooFeed ) {
				//Sort the items by date
				yahooFeed = yahooFeed.sort( function( a, b ) {
					var order = -1;
					if( a.pubEpoch < b.pubEpoch ) {
						order = 1;
					}

					return order;
				});

				//Limit to max items
				yahooFeed = formatterObj.truncateArray( yahooFeed, $rootScope.config.yahooFeed.maxItems );

				//Strip HTML and truncate description size
				var len = yahooFeed.length;
				for( var i = 0; i < len; i++ ) {
					var item = yahooFeed[i];
					item.description = formatterObj.stripHTML( item.description );
					item.description = formatterObj.truncateText( item.description, $rootScope.config.yahooFeed.maxDescriptionChars );
				}

				return yahooFeed;
			};

			return formatterObj;
	}]);
var PerfectScrollbar = angular.module( 'ATTMaster.PerfectScrollbar', []);

PerfectScrollbar.directive('perfectScrollbar', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		scope: 'isolate',
		link: function($scope, $elem, $attr) {
		    $elem.perfectScrollbar();
		    
		    //Initial refresh on startup
		    $timeout(function() { 
				$elem.perfectScrollbar('update'); 
			}, 500);
		    
		    //Reevaluate the scrollbar height, etc. on change of a property
			$attr.$observe( 'refreshOnChange', function( newValue ) {
				$timeout(function() { 
					$elem.perfectScrollbar('update'); 
				}, 0);
			});

			//Reset scroll position to top and update 
			$attr.$observe( 'resetPosOnChange', function( newValue ){
				$timeout(function() { 
					$elem.scrollTop(0);
					$elem.perfectScrollbar('update'); 
				}, 0);
			})
		}
	}
}]);
var StaticAdModule = angular.module( 'ATTMaster.StaticAdModule', []);

StaticAdModule.controller( 'StaticAdCtrl', ['$rootScope', '$scope', function ( $rootScope, $scope ) {
	
	//=== DECLARATIONS ===
	$scope.dataProvider = undefined;

	//=== CONTROL ===


	//=== LISTENERS ===

}]);

StaticAdModule.directive('staticAd', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/components/staticAd.tpl.html',
		replace: true,
		scope: 'isolate',
		controller: 'StaticAdCtrl',
		link: function( scope, element, attrs ) {
			scope.$watch( function(){ return element.attr( 'dataprovider' ); }, function( value ) { 
				scope.dataProvider = angular.fromJson( value );
			});
		}
	};
});
var TabBarModule = angular.module( 'ATTMaster.TabBarModule', []);

TabBarModule.controller( 'TabBarCtrl', ['$rootScope', '$scope', function( $rootScope, $scope ) {
	
	//=== DECLARATIONS ===
	$scope.selectedTabID = undefined;  
	$scope.tabListClass = '';

	//=== CONTROL ===
	$scope.getTabLabel = function( tab ) {
		var label = tab.label;
		//This didn't work!? if( $rootScope.isMobileOS ) {
		if( $scope.useMobileTemplates ) {
			label = tab.shortLabel;
		}

		return label;
	}

	$scope.selectActiveTab = function( activeTab ) {
		if( $scope.tabsProvider )
		{
			var len = $scope.tabsProvider.length;
			if( len !== undefined ) {
				for( var i = 0; i < len; i++ ) {
					var tab = $scope.tabsProvider[i];
					tab.active = ( tab.id === activeTab );
				}
			} else {
				for( var i in $scope.tabsProvider ) {
					var tab = $scope.tabsProvider[i];
					tab.active = ( tab.id === activeTab );
				}
			}
		}
	}


	//=== LISTENERS ===
	$scope.onTabClicked = function( tabID ) {
		$scope.selectedTabID = tabID;
		$scope.selectActiveTab( tabID );
		$scope.$emit( 'tabClicked', tabID );
	}
}]);

TabBarModule.directive('tabBar', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/components/tabBar.tpl.html',
		replace: true,
		scope: 'isolate',
		controller: 'TabBarCtrl',
		link: function( scope, element, attrs ) {
			scope.tabListClass = attrs.tablistclass;
			scope.$watch( function(){ return element.attr( 'selectedtabid' ); }, function( value ){ 
				scope.selectedTabID = value; 
			});
			scope.$watch( 'attrs.dataProvider', function(){} );
		}
	};
});

var LeaderboardModule = angular.module( 'ATTMaster.LeaderboardModule', []);

LeaderboardModule.controller( 'LeaderboardCtrl', ['$rootScope', '$scope', 'MastersService', function ( $rootScope, $scope, service ) {
	
	//=== DECLARATIONS ===
	$scope.leaderboard = undefined;
	$scope.useMobileLayout = false;


	//=== CONTROL ===
	$scope.findPlayerByID = function( id ) {
		var targetPlayer = undefined;
		var player = undefined;
		var len = $scope.leaderboard.length;
		for( var i = 0; i < len; i++ ) {
			player = $scope.leaderboard[i];
			if( player.id === id ) {
				targetPlayer = player;
				break;
			}
		}

		return targetPlayer;
	}

	$scope.filterPosition = function( player ) {
    	return player.position !== "-";    
  	};

  	$scope.getPlayerShortName = function( player ) {
  		var shortName = player.name;
  		try {
	  		var player = $rootScope.playerLookup[ player.id ];
	  		var initial = player.firstName[0] + '.';
	  		shortName = initial + ' ' + player.lastName;
  		} catch ( e ) {
  			//Player not found
  		}
		return shortName;
	}

	$scope.checkBreakpoint = function() {
		$scope.useMobileLayout = ( $rootScope.breakpoint === $rootScope.Breakpoints.HTABLET.id ||
									$rootScope.breakpoint === $rootScope.Breakpoints.PHONE.id );
	}


	//=== LISTENERS ===
	$scope.onPlayerClick = function( playerID ) {
		if( playerID !== '' ) {
			$scope.$emit( 'changePanelTab', $rootScope.TabIDs.BIOS );
			$rootScope.$broadcast( 'currentPlayerChanged', playerID );
		}	
	}

	$scope.$on( 'activeTabChanged', function( event, data ) {
		if( data == $rootScope.TabIDs.LEADERBOARD && !$scope.leaderboard ) {
			service.getLeaderboard();
		}
	});

	$rootScope.$on( $rootScope.LEADERBOARD_CHANGE, function( event, data ) {
		$scope.leaderboard = data;
	} );

	$rootScope.$on( $rootScope.BREAKPOINT_CHANGE, function(event, data ){
		$scope.checkBreakpoint();
		//Necessary for orientation event starting outside of angular in the iframe
		//$scope.$apply();
	});

	$scope.checkBreakpoint();
}]);

LeaderboardModule.filter( 'limitLeaderboard', function(){
	return function( timeMoment ) {
		var time = '';
		if( timeMoment ) {
			time = timeMoment.format( 'h:mm A' );
		}
		return time;
	}
})
var PairingsComingSoonModule = angular.module( 'ATTMaster.PairingsComingSoonModule', []);

PairingsComingSoonModule.directive('pairingsComingSoon', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/modules/pairingsComingSoon.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function( scope, element, attrs ) {
		}
	};
});
var PairingsGroupsModule = angular.module( 'ATTMaster.PairingsGroupsModule', []);

PairingsGroupsModule.directive('pairingsGroups', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/modules/pairingsGroups.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function( scope, element, attrs ) {
		}
	};
});
var PairingsModule = angular.module( 'ATTMaster.PairingsModule', ['ATTMaster.PairingsWithdrawnModule','ATTMaster.PairingsGroupsModule','ATTMaster.PairingsComingSoonModule']);

PairingsModule.controller( 'PairingsCtrl', ['$rootScope', '$scope', 'MastersService', function ( $rootScope, $scope, service ) {
	
	//=== DECLARATIONS ===
	$scope.currentTabID = undefined;
	$scope.tabsProvider = undefined;
	$scope.tabsDict = undefined;


	//=== CONTROL ===
	$scope.selectActiveDay = function( data ) {
		var activeTab = undefined;
		var lastTab = undefined;
		for( var i in data ) {
			var tab = data[i];
			if( tab.largestPairing === 0 ) {
				activeTab = lastTab || tab;
				break;
			}
			else
			{
				lastTab = tab;
				lastTab.active = false;
			}
		}

		activeTab.active = true;

		return activeTab.id; 
	}

	//For possible use on mobile: {{getPlayerCountry( group.players[0].id ) }}
	$scope.getPlayerCountry = function( playerID ) {
		return $rootScope.playerLookup[ playerID ].country;
	}

	$scope.getPlayerProp = function( players, index, prop ) {
		var propValue = '';
		if( players && players.length > index ) {
			propValue = players[ index ][ prop ];
		}
		return propValue;
	}

	$scope.switchTabs = function( tabID ) {
		//Update active state
		for( var i in $scope.tabsProvider ) {
			var tab = $scope.tabsProvider[i];
			tab.active = ( tab.id === tabID )
			$scope.tabsDict[ tab.id ].active = tab.active;
		}

		$scope.currentTabID = tabID;
		$scope.currentTab = $scope.tabsDict[ tabID ];
		$scope.largestPairing = $scope.currentTab.largestPairing;
		$scope.dataProvider = $scope.currentTab.dataProvider;
	}

	$scope.checkBreakpoint = function() {
		$scope.useMobileTemplates = ( $rootScope.breakpoint === $rootScope.Breakpoints.HTABLET.id ||
										$rootScope.breakpoint === $rootScope.Breakpoints.PHONE.id );
		if( $scope.useMobileTemplates ) {
			$scope.switchTabs( $scope.selectActiveDay( $scope.tabsDict ) );
		}
	}


	//=== LISTENERS === 
	$scope.$on( $rootScope.PAIRINGS_CHANGE, function( event, data ){

		$scope.tabsDict = data; 
		$scope.tabsProvider = [];
		for( var i in data ) {
			$scope.tabsProvider.push( data[i] );
		}
		$scope.currentTabID = $scope.selectActiveDay( data );
		$scope.currentTab = data[ $scope.currentTabID ];
		$scope.largestPairing = $scope.currentTab.largestPairing;
	});

	$scope.$on( 'activeTabChanged', function( event, data ) {
		$scope.dataProvider = $scope.currentTab.dataProvider;
	});

	$scope.$on( 'tabClicked', function( event, tabID ){
		//Keep TabPanelModule from hearing this
		event.stopPropagation();

		$scope.switchTabs( tabID );
	});

	$scope.onPlayerClick = function( playerID ) {
		if( playerID !== '' ) {
			$scope.$emit( 'changePanelTab', $rootScope.TabIDs.BIOS );
			$rootScope.$broadcast( 'currentPlayerChanged', playerID );
		}	
	}

	$rootScope.$on( $rootScope.BREAKPOINT_CHANGE, function(event, data ){
		$scope.checkBreakpoint();
	});

	service.getPairings();
}])
.filter( 'formatTime', function(){
	return function( timeMoment ) {
		var time = '';
		if( timeMoment ) {
			time = timeMoment.format( 'h:mm A' );
		}
		return time;
	}
})

var PairingsWithdrawnModule = angular.module( 'ATTMaster.PairingsWithdrawnModule', []);

PairingsWithdrawnModule.directive('pairingsWithdrawn', function() {
	return {
		restrict: 'E',
		templateUrl: 'templates/modules/pairingsWithdrawn.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function( scope, element, attrs ) {
		}
	};
});
var PlayerBiosModule = angular.module( 'ATTMaster.PlayerBiosModule', []);

PlayerBiosModule.controller( 'PlayerBiosCtrl', ['$rootScope', '$scope', 'MastersService', function ( $rootScope, $scope, service ) {
	
	//=== DECLARATIONS ===
	$scope.playerBios = undefined;
	$scope.currentPlayer = undefined;
	$scope.playerDropdownVisible = false;


	//=== CONTROL ===
	$scope.findPlayerByID = function( id ) {
		var targetPlayer = undefined;
		var player = undefined;
		var len = $scope.playerBios.length;
		for( var i = 0; i < len; i++ ) {
			player = $scope.playerBios[i];
			if( player.id === id ) {
				targetPlayer = player;
				break;
			}
		}

		return targetPlayer;
	}

	$scope.togglePlayersDropdown = function( force ) {
		if( force !== undefined ) {
			$scope.playerDropdownVisible = force;
		} else {
			$scope.playerDropdownVisible = !$scope.playerDropdownVisible;
		}

	}


	//=== LISTENERS ===
	$scope.onPlayerClick = function( playerID ) {
		if( playerID !== '' ) {
			$rootScope.$broadcast( 'currentPlayerChanged', playerID );
		}	
		$scope.togglePlayersDropdown( false );
	}

	$scope.$on( 'activeTabChanged', function( event, data ) {
		if( !$scope.currentPlayer && $scope.playerBios && $scope.playerBios.length ) {
			$scope.currentPlayer = $scope.playerBios[0];
		}
	});

	$rootScope.$on( $rootScope.BIOS_CHANGE, function( event, data ) {
		$scope.playerBios = data;
	} );

	$rootScope.$on( 'currentPlayerChanged', function( event, data ){
		if( data && $scope.currentPlayer && data !== $scope.currentPlayer.id ) {
			$scope.currentPlayer = $scope.findPlayerByID( data );
			if( $scope.currentPlayer === undefined && $scope.playerBios !== undefined ) {
				$scope.currentPlayer = $scope.playerBios[0];
			}
		}
	} );

	service.getPlayerBios();
}]);
var ScheduleModule = angular.module( 'ATTMaster.ScheduleModule', []);

ScheduleModule.controller( 'ScheduleCtrl', 
	['$rootScope', '$scope', '$sce', 'MastersService', 
	function ( $rootScope, $scope, $sce, service ) {
	
	//=== DECLARATIONS ===
	$scope.schedule = undefined;


	//=== CONTROL ===
	$scope.getDayOfWeek = function( dayMoment ) {
		return dayMoment.format( 'dddd' );
	}

	$scope.getMonth = function( dayMoment ) {
		return dayMoment.format( 'MMMM' );
	}

	$scope.getDayOfMonth = function( dayMoment ) {
		return dayMoment.format( 'D' );
	}

	$scope.getOrdinal = function( dayMoment ) {
		var dayOfMonth = dayMoment.format( 'D' );
		var ordinal = dayMoment.format( 'Do' );
		ordinal = ordinal.replace( dayOfMonth, '' );

		return ordinal;
	}

	$scope.formatTime = function( dateTimeString ) {
		var eventMoment = moment( dateTimeString, "YYY-M-D HH:MM" );
		return eventMoment.format( 'h:mm a' );
	}

	$scope.formatTimeRange = function( dateString, startTime, endTime ) {
		var timeRange = '';
		if( startTime.indexOf( ":" ) < 0 ) {
			//This allows for non-time code start times, such as "After play concludes"
			timeRange = startTime;
		} else {
			var startMoment = moment( dateString + " " + startTime, 'YYYY-M-D hh:mm' );
			var endMoment = moment( dateString + " " + endTime, 'YYYY-M-D hh:mm' );
			timeRange = startMoment.format( "h:mm a" ) + " - " + endMoment.format( "h:mm a" );
		}

		return timeRange;
	}

	//Necessary to put in line breaks in description
	$scope.formatDescription = function( description ) {
		description = description.replace("<br/>","<span>");
		return $sce.trustAsHtml( description );
	}

	//=== LISTENERS ===
	$rootScope.$on( $rootScope.SCHEDULE_CHANGE, function( event, data ) {
		$scope.schedule = data;
	});

	service.getSchedule();
}]);
var TabPanelModule = angular.module( 'ATTMaster.TabPanelModule', ['ATTMaster.PairingsModule', 'ATTMaster.PlayerBiosModule', 'ATTMaster.ScheduleModule', 'ATTMaster.LeaderboardModule']);

TabPanelModule.controller( 'TabPanelCtrl', ['$rootScope', '$scope', '$timeout', '$document', function ( $rootScope, $scope, $timeout, $document ) {
	
	//=== DECLARATIONS ===
	$scope.currentTabID = $rootScope.TabIDs.SCHEDULE;
	$scope.tabsProvider = [	{ 
								id:$rootScope.TabIDs.SCHEDULE, 
								label:'Live Schedule', 
								shortLabel:'Schedule', 
								template:'templates/modules/liveSchedule.tpl.html',
								mobileTemplate:'templates/modules/liveScheduleMobile.tpl.html',
								active: true
							},
							{ 
								id:$rootScope.TabIDs.PAIRINGS, 
								label:'Daily Pairings', 
								shortLabel:'Pairings',  
								template:'templates/modules/pairings.tpl.html',
								mobileTemplate:'templates/modules/pairings.tpl.html',
								active: false
							},
							{ 
								id:$rootScope.TabIDs.BIOS, 
								label:'Player Bios', 
								shortLabel:'Bios', 
								template:'templates/modules/playerBios.tpl.html',
								mobileTemplate:'templates/modules/playerBios.tpl.html',
								active: false
							},
							{ 
								id:$rootScope.TabIDs.LEADERBOARD, 
								label:'Leaderboard', 
								shortLabel:'Leaderboard', 
								template:'templates/modules/leaderboard.tpl.html',
								mobileTemplate:'templates/modules/leaderboard.tpl.html',
								active: false
							}
						];


	//=== CONTROL ===
	$scope.selectActivePanel = function( tabID ) {
		var len = $scope.tabsProvider.length;
		for( var i = 0; i < len; i++ ) {
			var tab = $scope.tabsProvider[i];
			tab.active = (tab.id === tabID);
		}

		$scope.$broadcast( 'activeTabChanged', tabID );
	}

	$scope.getTemplate = function( tab ) {
		var template = tab.template;
		if( $scope.useMobileTemplates ) {
			template = tab.mobileTemplate;
		}
		return template;
	}

	$scope.checkBreakpoint = function() {
		$scope.useMobileTemplates = ( $rootScope.breakpoint === $rootScope.Breakpoints.HTABLET.id ||
										$rootScope.breakpoint === $rootScope.Breakpoints.PHONE.id );
	}

	$scope.getPanelHeight = function() {
		$timeout(function(){
			var bodyHeight = $document[0].body.clientHeight;
			var newFrameHeight = bodyHeight;
			var frameHeight = newFrameHeight + 'px';
			var frameWidth = '320px';
			parent.frameBreakpoint(frameHeight, frameWidth);
		}, 0);
	}


	//=== LISTENERS ===
	$scope.$on( 'tabClicked', function( event, data ){
		$scope.currentTabID = data;
		$scope.selectActivePanel( data );
		if ( $rootScope.breakpoint.toUpperCase() === 'PHONE' ) {
			$scope.getPanelHeight();
		}
	});

	$scope.$on( 'changePanelTab', function( event, data ){
		$scope.currentTabID = data;
		$scope.selectActivePanel( data );
	});

	$rootScope.$on( $rootScope.BREAKPOINT_CHANGE, function(event, data ){
		$scope.checkBreakpoint();
		//Necessary for orientation event starting outside of angular in the iframe
		$scope.$apply();
	});

	$scope.checkBreakpoint();
}]);

TabPanelModule.directive('tabPanel', [ '$timeout', function($timeout) {
		return {
			restrict: 'E',
			templateUrl: 'templates/modules/tabPanel.tpl.html',
			replace: true,
			scope: 'isolate',
			controller: 'TabPanelCtrl',
			link: function(scope, element, attrs) {
			}
		};
	}]);
var YahooFeedModule = angular.module( 'ATTMaster.YahooFeedModule', []);

YahooFeedModule.controller( 'YahooFeedCtrl', 
	['$rootScope', '$scope', '$sce', 'MastersService', 
	function ( $rootScope, $scope, $sce, service ) {
	
	//=== DECLARATIONS ===
	$scope.yahooFeed = undefined;
	$scope.extraFeedCalled = false;
	$scope.isHorizontalTablet = ($rootScope.breakpoint === $rootScope.Breakpoints.HTABLET.id);
	$scope.errorMessage = undefined;


	//=== CONTROL ===
	$scope.formatErrorMessage = function( errorMessage ) {
		return $sce.trustAsHtml( errorMessage );
	}

	//=== LISTENERS ===
	$rootScope.$on( $rootScope.YAHOO_FEED_CHANGE, function( event, data ) {
		$scope.yahooFeed = data;
		if( !$scope.extraFeedCalled ) {
			$scope.extraFeedCalled = true;

			if( $rootScope.config.yahooFeed.includeExtraFeed ) {
				service.getExtraYahooGolfFeed();
			}
		}
	});

	$rootScope.$on( $rootScope.YAHOO_FEED_ERROR, function( event, data ) {
		$scope.errorMessage = $rootScope.config.yahooFeed.errorMessage;
	});

	$rootScope.$on( $rootScope.ORIENTATION_CHANGE, function( event, data ) {
		$scope.isHorizontalTablet = ($rootScope.breakpoint === $rootScope.Breakpoints.HTABLET.id);
		$scope.$apply();
	});


	service.getYahooGolfFeed();
}]);

YahooFeedModule.directive('yahooFeed', [ '$timeout', function($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'templates/modules/yahooFeed.tpl.html',
		replace: true,
		scope: 'isolate',
		controller: 'YahooFeedCtrl',
		link: function(scope, element, attrs) {
		}
	};
}]);

var SocialComponentModule = angular.module( 'ATTMaster.SocialComponentModule', []);

SocialComponentModule.directive('socialComponent', [ '$timeout', function($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'templates/modules/socialComponent.tpl.html',
		replace: true,
		scope: 'isolate',
		link: function(scope, element, attrs) {
		}
	};
}]);
