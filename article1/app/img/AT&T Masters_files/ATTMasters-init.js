var wrapperVersion = "0.0.1";

//Put in a parseXml method for browsers that don't support it
var parseXml;
if ( window.DOMParser ) {
	parseXml = function( xmlStr ) {
		return ( new window.DOMParser() ).parseFromString( xmlStr, "text/xml" );
	};
} else if ( typeof window.ActiveXObject != "undefined" && new window.ActiveXObject( "Microsoft.XMLDOM" ) ) {
	parseXml = function( xmlStr ) {
		var xmlDoc = new window.ActiveXObject( "Microsoft.XMLDOM" );
		xmlDoc.async = "false";
		xmlDoc.loadXML( xmlStr );
		return xmlDoc;
	};
} else {
	parseXml = function() {
		return null;
	}
}

var attMastersConfig = {
	EVENT_STATE_LIVE: 'live',
	EVENT_STATE_END_OF_DAY: 'endOfDay',
	EVENT_STATE_POST_EVENT: 'postEvent',

	eventState: this.EVENT_STATE_LIVE,
	qaActive: false,
	//If inactiveSlate is set to anything other than '' or null, the player will not show and instead
	//it will try to load the value as a slate in place of the player
	inactiveSlate: '', //'http://office.realeyes.com/att/fakeThumbs/Saturday_Noon_Slate.jpg',

	//pageDomain: "http://code.realeyes.com",
	pageDomain: "http://10.1.10.47:3050",

	//Constants for Breakpoints
	breakpoints: {
		DESKTOP: {
			id: 'desktop',
			minWidth: 1024,
			frameWidth: '975px',
			frameHeight: '1635px',
			orientation: 0
		},
		VTABLET: {
			id: 'vTablet',
			minWidth: 500,
			frameWidth: '960px',
			frameHeight: '1596px',
			orientation: 0
		},
		HTABLET: {
			id: 'hTablet',
			minWidth: 720,
			frameWidth: '1012px',
			frameHeight: '608px',
			orientation: 90
		},
		PHONE: {
			id: 'phone',
			minWidth: 0,
			frameWidth: '320px',
			frameHeight: '800px',
			orientation: 0,
		},
		PHONE480: {
			id: 'phone480',
			minWidth: 0,
			frameWidth: '480px',
			frameHeight: '800px',
			orientation: 0,
		}
	},

	services: {
		biosService: '../data/bios.xml',
		leaderboardService: '../data/scores.xml',
		leaderboardInterval: 30000,
		leaderboardPoll: undefined,
		scheduleService: 'data/schedule.json',
		pairingsService: '../data/pairings.json',
		yahooService: 'http://sports.yahoo.com/golf/rss.xml',
		extraYahooService: 'http://sports.yahoo.com/golf/blog/devil_ball_golf/rss.xml'
	},

	yahooFeed: {
		maxItems: 10,
		maxDescriptionChars: 255,
		includeExtraFeed: true,
		errorMessage: "There was an error loading the Yahoo! Golf news feed. Please try again later, or visit the <a href='http://sports.yahoo.com/golf/' target='_blank'>Yahoo! Golf site</a>."
	},

	ad: {
		adSrc: 'http://placehold.it/300x250&text=Ad+Placeholder',
		adURL: 'http://www.uverse.com',
		adAltText: 'This is an advertisement for UVerse.com'
	}
};

//Don't start up the player if the inactive slate is set
if ( attMastersConfig.inactiveSlate && attMastersConfig.inactiveSlate !== '' ) {
	manualSetup = true;
	console.log( 'Will hide player' );
}

$( function() {
	console.info( "WRAPPER VERSION", wrapperVersion );
	angular.bootstrap( $( '#masters-wrapper' ), [ 'ATTMasters' ] );
} );