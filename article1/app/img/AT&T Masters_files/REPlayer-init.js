var version = "0.0.4";
var api;
var timelineSvc;
var playerModule;
var playerRef;

//=== IE Fixes ===
if(!window.console) {
	window.console = { log: function(){}, debug: function(){}, info: function(){} } ;
} else if( !window.console.debug ) {
	window.console.debug = function(){};
};

if( !window.hasOwnProperty ) {
	window.hasOwnProperty = function( name ) { return (window[name] !== undefined); };
}
//=== End IE Fixes ===

var defaultWidth = 912;
var defaultHeight = 513;

var embedPage = window.location;

//var settingsURL = 'http://vpcms.istreamplanet.com/data/settings/rmsday2l3337e2a.xml?ignore=63f131cb-b00f-7f7b-b7f2-d545e4b52868';
var settingsURL = '../data/sample-data.xml';
var xmltoJSON = new XMLToJSON();

var config = {
	localConfig:false,
	akamai: {
		viewerID: '', // Changed akamaiID to viewerID  
		viewerDiagnosticsID: '',
		scriptURL: 'http://79423.analytics.edgesuite.net/html5/akamaihtml5-min.js'
	},
	audioStreamName: '',
	autoHideControls: false,
	autoHideControlsDelay: 2000,
	autoPlay: false,
	captionStreamName: '',
	ccEnabled: true,
	ccSource: '',
	color: '993300',
	markerColor: '333333',
	convivaID: '',
	defaultWidth: defaultWidth,
	defaultHeight: defaultHeight,
	description: 'This is a sample video.',
	cdn: 'Level 3',
	embed: false,
	enableTimelineMarkerOverlay: true,
	estimatedLiveDuration: '0',
	failoverURL: 'http://office.realeyes.com:8134/vod/trailer.mp4',
	failoverURLType: 'progressive',
	html5URL: 'http://office.realeyes.com:8134/hls-vod/trailer.mp4.m3u8',
	isLive: false,
	loop: false,
	mediaURLType: '',
	playerReplayOffset: '15',
	poster: 'http://media.w3.org/2010/05/sintel/poster.png',
	errorSlate: 'images/error-slate.jpg',
	share: true,
	showDescription: true,
	socialTitle: 'Social Title',
	shareTimeEnabled: false,
	source: 'http://office.realeyes.com:8134/hds-jit-vod/trailer.mp4.f4m',
	sources: [ 	{ 	name: "Amen Corner", 
					url: "http://office.realeyes.com:8134/hds-jit-vod/trailer.mp4.f4m", 
					html5FailoverURL: "http://office.realeyes.com:8134/vod/trailer.mp4", 
					html5URL: 'http://office.realeyes.com:8134/vod/trailer.mp4', 
					thumbnailURL: 'http://office.realeyes.com/att/fakeThumbs/cam1.png',
					type: "recorded", 
					main: 1, 
					sync: 0 
				}, 
				{ 	name:"Holes 15 and 16", 
					url:"rtmp://office.realeyes.com/vod/mp4:beer.mp4", 
					html5FailoverURL: "http://clips.vorwaerts-gmbh.de/VfE_html5.mp4", 
					html5URL: "http://clips.vorwaerts-gmbh.de/VfE_html5.mp4", 
					thumbnailURL: 'http://office.realeyes.com/att/fakeThumbs/cam2.png',
					main: 0, 
					sync: 0, 
					type: "recorded" 
				},
				{ 	name:"Featured Pair", 
					url:"rtmp://office.realeyes.com/vod/seeker", 
					html5FailoverURL: "http://static.bouncingminds.com/ads/30secs/country_life_butter.mp4", 
					html5URL: 'http://static.bouncingminds.com/ads/30secs/country_life_butter.mp4', 
					thumbnailURL: 'http://office.realeyes.com/att/fakeThumbs/cam3.png',
					main: 0, 
					sync: 0, 
					type: "recorded" 
				} 
				],
	startTime: '0',
	title: 'Sample Video',
	volume: '50', 
	pipEnabled: true,
	
	//###pluginsXML: '<plugins><plugin source="http://players.edgesuite.net/flash/plugins/osmf/advanced-streaming-plugin/v3.1/osmf2.0/AkamaiAdvancedStreamingPlugin.swf"><metadata><value name="netSessionMode" value="never" /></metadata></plugin><plugin name="AkamaiAnalytics" classPath="com.akamai.playeranalytics.osmf.OSMFCSMALoaderInfo"><metadata><value name="csmaPluginPath" value="http://79423.analytics.edgesuite.net/csma/plugin/csma.swf" /><value name="csmaConfigPath" value="http://ma72-r.analytics.edgesuite.net/config/beacon-2576.xml" /></metadata></plugin></plugins>',
	plugins:{
		AkamaiHDCore:{
			name:"AkamaiHDCore",
			enabled:true,
			source:"http://players.edgesuite.net/flash/plugins/osmf/advanced-streaming-plugin/v3.2/osmf2.0/AkamaiAdvancedStreamingPlugin.swf",
			metadata:{
				netSessionMode:"never"
			}
		},
		AkamaiAnalytics:{
			name:"AkamaiAnalytics",
			enabled:true,
			source:"com.akamai.playeranalytics.osmf.OSMFCSMALoaderInfo",
			metadata:{
				csmaPluginPath:"http://79423.analytics.edgesuite.net/csma/plugin/csma.swf",
				csmaConfigPath:"http://ma191-r.analytics.edgesuite.net/config/beacon-2135.xml"
			}
		}
	},
	referralURL: 'http://www.google.com',
	//shareTargetsXML: '<ShareTargets><ShareTarget Name="FB" DisplayName="Facebook" TrackName="Facebook" Icon="/Images/Facebook.jpg"><ShareFormat><![CDATA[http://www.facebook.com/sharer.php?u={url}&t=Share]]></ShareFormat></ShareTarget><ShareTarget Name="TW" DisplayName="Twitter" TrackName="Twitter" Icon="/Images/Twitter.jpg"><ShareFormat><![CDATA[https://twitter.com/intent/tweet?text=I am%20watching%20Share%20at%20{url}]]></ShareFormat></ShareTarget><ShareTarget Name="SU" DisplayName="StumbleUpon" TrackName="StumbleUpon" Icon="/Images/StumbleUpon.jpg"><ShareFormat><![CDATA[http://www.stumbleupon.com/submit?url={url}]]></ShareFormat></ShareTarget><ShareTarget Name="DE" DisplayName="Delicious" TrackName="Delicious" Icon="/Images/Delicious.jpg"><ShareFormat><![CDATA[http://del.icio.us/post?url={url}&title=Share]]></ShareFormat></ShareTarget><ShareTarget Name="DI" DisplayName="Digg" TrackName="Digg" Icon="/Images/Digg.jpg"><ShareFormat><![CDATA[http://digg.com/submit?phase=2&url={url}&title=Share]]></ShareFormat></ShareTarget><ShareTarget Name="RE" DisplayName="Reddit" TrackName="Reddit" Icon="/Images/Reddit.jpg"><ShareFormat><![CDATA[http://www.reddit.com/login?dest=/submit?url={url}]]></ShareFormat></ShareTarget><ShareTarget Name="ML" DisplayName="Mail" TrackName="Mail" Icon="/Images/Mail.jpg"><ShareFormat><![CDATA[mailto:?subject=Share&body={url}]]></ShareFormat></ShareTarget></ShareTargets>',
	embedCode: "<iframe src='" + embedPage + "' width='" + (defaultWidth + 50 ) + "' height='" + defaultHeight + "' frameborder='0' scrolling='no' seamless></iframe>",
	//markersXML: '<Markers><Marker Text="Test timeline marker - 5s" Time="00:00:05" /><Marker Text="Test timeline marker - 15s" Time="00:00:15" /></Markers>'
	//timelineMarkerDataSource: "http://code.realeyes.com/isp/dev/testMarkers/test-markers.xml",
	//timelineMarkerDataInterval: "15", //number of seconds to wait. Will come in as a timecode from the service
	livePositionBufferDuration:20,
	buffer: 1,

	osmfSettings: {
    	hdsMinimumBufferTime: 4,
    	hdsAdditionalBufferTime: 2,
    	hdsBytesProcessingLimit: 1024000,
    	hdsBytesReadingLimit: 102400,
    	hdsMainTimerInterval: 25,
    	hdsLiveStallTolerance: 15,
    	hdsDefaultFragmentsThreshold: 5,
    	hdsMinimumBootstrapRefreshInterval: 2000,
    	hdsDVRLiveOffset: 30,
    	hdsPureLiveOffset: 5,
    	f4mParseTimeout: 30000,
    	hdsMaximumRetries: 5,
    	hdsTimeoutAdjustmentOnRetry: 4000,
    	hdsFragmentDownloadTimeout: 4000,
    	hdsIndexDownloadTimeout: 4000
    }
};

function updateEmbedCode()
{
	
	config.embedCode = "<iframe src='" + embedPage + "' width='" + (config.defaultWidth +  sideNavBuffer() ) + "' height='" + config.defaultHeight + "' frameborder='0' scrolling='no' seamless></iframe>"
	//console.info("UPDATE EMBED CODE", config.embedCode);;
}

function sideNavBuffer()
{
	if( config.embed || config.showDescription || config.share )
	{
		return 50;
	}
	
	return 0;
}

function apiReady(playerAPI) {
	api = playerAPI;
	
	$(api).on('mouseEnterVideoDisplay', function() {
		
	});
	
	$(api).on('mouseLeaveVideoDisplay', function() {
		
	});
}

function playerModuleReady(module) {
	console.log('player module ready');
	playerModule = module;
	
	// we now have the config, so we can fire up the timeline service
	api.configure(config);
	
	// also get the timeline markers
	markerService.configure(config);
	markerService.loadTimelineMarkers();
	
}

function onMarkerServiceReady(service) {
	console.log('onMarkerServiceReady fired!');
	markerService = service;
}

function playerReferenceReady(ref) {
	playerRef = ref;
	if( api.configuration.markers ) {
		api.setTimelineMarkers( api.configuration.markers );
	}
	// FIXME: Testing
	//api.setVolume(0);
	// END: Testing
}

function loadService(){
	$.get( settingsURL )
		.done(function(result) {

			resultAsJSON = xmltoJSON.parseXML(result);
			console.log(resultAsJSON);

			var parameters = resultAsJSON.Settings.Parameters.Parameter;
			
			for(var i = 0; i < parameters.length; i++) {
				var parameter = parameters[i];
				
				switch(parameter.Name.toLowerCase()) {
					case 'title':{
						window.config.title = parameter.Value;
						break;
					}
					case 'description':{
						window.config.description = parameter.Value;
						break;
					}
					case 'socialtitle':{
						window.config.socialTitle = parameter.Value;
						break;
					}
					case 'shareTimeEnabled':{
						window.config.shareTimeEnabled = parameter.Value === 'true';
						break;
					}
					case 'color':{
						window.config.color = parameter.Value;
						break;
					}
					case 'markerColor':{
						window.config.markerColor = parameter.Value;
						break;
					}
					case 'autoplay':{
						window.config.autoPlay = parameter.Value === 'true';
						break;
					}
					case 'showdescription':{
						window.config.showDescription = parameter.Value === 'true';
						break;
					}
					case 'embed':{
						window.config.embed = parameter.Value === 'true';
						break;
					}
					case 'share':{
						window.config.share = parameter.Value === 'true';
						break;
					}
					case 'cc':{
						window.config.ccEnabled = parameter.Value === 'true';
						break;
					}
					case 'loaderslate':{
						window.config.poster = parameter.Value;
						break;
					}
					case 'live':{
						window.config.isLive = parameter.Value === 'true';
						break;
					}
					case 'start':{
						window.config.startTime = parseFloat(parameter.Value);
						break;
					}
					case 'estimatedliveduration':{
						window.config.estimatedLiveDuration = parseFloat(parameter.Value);
						break;
					}
					case 'audiostreamname':{
						window.config.audioStreamName = parameter.Value;
						break;
					}
					case 'captionstreamname':{
						window.config.captionStreamName = parameter.Value;
						break;
					}
					case 'mediaurl':{
						window.config.source = parameter.Value;
						break;
					}
					case 'mediaurltype':{
						window.config.mediaURLType = parameter.Value;
						break;
					}
					case 'failoverurl':{
						window.config.failoverURL = parameter.Value;
						break;
					}
					case 'failoverurltype':{
						window.config.failoverURLType = parameter.Value;
						break;
					}
					case 'html5url':{
						window.config.html5URL = parameter.Value;
						break;
					}
					case 'volume':{
						window.config.volume = parameter.Value;
						break;
					}
					case 'referralurl':{
						window.config.referralURL = parameter.Value;
						break;
					}
				}
			}

			var datasources = resultAsJSON.Settings.DataSources.DataSource;
			//If only one, will not come in as an array
			if( datasources && !datasources.length && datasources.Url ) {
				datasources = [ datasources ];
			} else if( !datasources ) {
				datasources = [];
			}

			for(var i = 0; i < datasources.length; i++) {
				var datasource = datasources[i];
				
				switch(datasource.Name.toLowerCase()) {
					case 'timelinemarkerdatasource':{
						window.config.timelineMarkerDataSource = datasource.Url;
						window.config.timelineMarkerDataInterval = translateTimeCodeToSeconds( datasource.Interval );
						break;
					}
				}
			}

			//Normalize the volume to 0-1
			if( window.config.volume > 1 )
			{
				var volume = window.config.volume / 100;
				if( volume > 1 ) {
					volume = 1;
				}

				window.config.volume = volume;
			}

			if( resultAsJSON.Settings.hasOwnProperty('ShareTargets' ) && resultAsJSON.Settings.ShareTargets.hasOwnProperty('ShareTarget' ) ) {
				var shareTargetsJSON = resultAsJSON.Settings.ShareTargets.ShareTarget;
				window.config.shareTargets = window.translateShareTargetsJSON( shareTargetsJSON );
			} else if( window.config.shareTargetsXML ) {
				var shareFromXMLJSON = xmltoJSON.parseXML( $.parseXML( window.config.shareTargetsXML ) );
				shareFromXMLJSON = shareFromXMLJSON.ShareTargets.ShareTarget;
				window.config.shareTargets = window.translateShareTargetsJSON( shareFromXMLJSON );
			}

			// if( resultAsJSON.Settings.hasOwnProperty('Markers') && resultAsJSON.Settings.Markers.hasOwnProperty('Marker') ) {
			// 	var markersJSON = resultAsJSON.Settings.Markers.Marker;
			// 	window.config.markers = window.translateMarkersJSON( markersJSON );
			// } else if( window.config.markersXML ) {
			// 	var markersFromXMLJSON = xmltoJSON.parseXML( $.parseXML( window.config.markersXML ) );
			// 	markersFromXMLJSON = markersFromXMLJSON.Markers.Marker;
			// 	window.config.markers = window.translateMarkersJSON( markersFromXMLJSON );
			// }

			//Translate the plugins
			if( resultAsJSON.Settings.hasOwnProperty( 'Plugins') ) {
				var pluginsJSON = resultAsJSON.Settings.Plugins.PluginDescriptor;
				if( pluginsJSON) {
					//If only a single descriptor, it's going to be an object, not an array
					if( !pluginsJSON.hasOwnProperty( 'length') ) {
						pluginsJSON = [ pluginsJSON ];
					}
					translatePluginsJSON( pluginsJSON );
				}
			}

			applyURLVars();
			
			//window.api.configure(config);
			
			angular.bootstrap( $('#replayer'), ['REPlayer']);
			
		})
		.fail(function(error) {
			console.log(error)
			//TODO: SHOW ERROR SLATE?				
			
			angular.bootstrap( $('#replayer'), ['REPlayer']);
		});
}

window.location.getParameter = function(key) {
    function parseParams() {
        var params = {},
            e,
            a = /\+/g,  // Regex for replacing addition symbol with a space
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
            q = window.location.search.substring(1);

        while (e = r.exec(q))
            params[d(e[1])] = d(e[2]);
        
        
        return params;
    }

    if (!this.queryStringParams)
        this.queryStringParams = parseParams(); 

    return this.queryStringParams[key];
 };

//Document ready
$(function(){
	
	
	console.info("VERSION", version);
	var lc = window.location.getParameter("lc");
	var configURL = window.location.getParameter("config");
	var mediaURL = window.location.getParameter("mediaURL");
	var html5URL = window.location.getParameter("html5URL");
	var failoverURL = window.location.getParameter("failoverURL");
	var w = window.location.getParameter("w");
	var h = window.location.getParameter("h");
	var startTime = window.location.getParameter("st");
	
	
	if( lc != undefined )
	{
		config.localConfig = lc == "1" ? true : false;
	}
	
	if( manualSetup )
	{
		config.localConfig = true;
	}

	updateEmbedCode();
	
	console.log(config);
	
	//window.alert("Clocal Config: " + config.localConfig );
	
	if ( config.localConfig  && !manualSetup )
	{
		applyURLVars();
		
		angular.bootstrap( $('#replayer'), ['REPlayer']);
	}
	else if( !config.localConfig )
	{
		loadService();
	}

});

function applyURLVars()
{
	
	var configURL = window.location.getParameter("config");
	var mediaURL = window.location.getParameter("mediaURL");
	var html5URL = window.location.getParameter("html5URL");
	var failoverURL = window.location.getParameter("failoverURL");
	var w = window.location.getParameter("w");
	var h = window.location.getParameter("h");
	var startTime = window.location.getParameter("st");
	
	if( configURL != undefined )
	{
		settingsURL = configURL;
	}
	
	if( mediaURL != undefined )
	{
		config.source = mediaURL;
	}
	
	if( html5URL != undefined )
	{
		config.html5URL = html5URL;
	}
	
	if( failoverURL != undefined )
	{
		config.failoverURL = failoverURL;
	}
	
	if( w != undefined )
	{
		config.defaultWidth = Number(w);
	}
	
	if( h != undefined )
	{
		config.defaultHeight = Number(h);
	}
	
	if( startTime != undefined )
	{
		config.startTime = Number(startTime);
	}
}

function translateTimeCodeToSeconds( timecode ) {
	var seconds = 0;
	if( timecode.indexOf(':') > 0 ) {
		//Translate timecode to seconds
		var times = timecode.split( ':' );
		seconds = 3600 * parseInt( times[0] );
		seconds += 60 * parseInt( times[1] );
		seconds += parseInt( times[2] );
	} else {
		//Assume we're getting seconds
		seconds = parseInt( timecode );
	}

	return seconds;
}

function translateShareTargetsJSON( shareTargetsJSON ) {
	var shareTargets = [];
	
	//If there is only one, it won't be an array
	if( !shareTargetsJSON.length && shareTargetsJSON.Name ) {
		shareTargetsJSON = [ shareTargetsJSON ];
	}

	for(var i = 0; i < shareTargetsJSON.length; i++) {
		shareTargets.push({
			name: shareTargetsJSON[i].Name.toLowerCase(),
			displayName: shareTargetsJSON[i].DisplayName,
			trackName: shareTargetsJSON[i].TrackName,
			url: shareTargetsJSON[i].ShareFormat
		});
	}

	return shareTargets;
}

// function translateMarkersJSON( markersJSON ) {
// 	var markers = [];
	
// 	//If there is only one, it won't be an array, so make it one
// 	if( !markersJSON.length && markersJSON.Text ) {
// 		markersJSON = [ markersJSON ];
// 	}

// 	for(var i = 0; i < markersJSON.length; i++) {
// 		markers.push({
// 			text: markersJSON[i].Text,
// 			time: markersJSON[i].Time
// 		});
// 	}

// 	return markers;
// }

function translatePluginsJSON( pluginsJSON ) {
	var pluginsDict = window.config.plugins;
	if( !pluginsDict ) {
		pluginsDict = window.config.plugins = {};
	}

	if( pluginsJSON )
	{
		var len = pluginsJSON.length;
		for( var i = 0; i < len; i++ ) 
		{
			//Change property names for other data structures
			var pluginJSON = pluginsJSON[i];
			var pluginObj = {};
			pluginObj.name = pluginJSON.Name;
			pluginObj.enabled = (String( pluginJSON.IsEnabled ).toLowerCase() === 'true');
			pluginObj.source = pluginJSON.PluginUrl;

			//Store metadata as dictionary
			var paramDict = {};
			if( pluginJSON.Parameters ) {
				var parameters = pluginJSON.Parameters.Parameter;
				if( parameters && !parameters.length ) {
					parameters = [ parameters ];
				} else if( !parameters ) {
					parameters = [];
				}

				var numParams = parameters.length;
				for( var j = 0; j < numParams; j++ )
				{
					var param = parameters[j];
					paramDict[ param.Name ] = param.Value;
				} 
			} 
			pluginObj.metadata = paramDict;

			//Add plugin to existing dictionary
			if( pluginObj.name == 'AkamaiAnalytics' ) {
				//If AkamaiAnalytics is defined in page, only don't override the config properties.
				var aaObj = pluginsDict[ pluginObj.name ];
				if( !aaObj ) {
					aaObj = pluginObj;
				}
				
				aaObj.source = pluginObj.source || aaObj.source;
				aaObj.enabled = pluginObj.enabled;

				if( aaObj.metadata === undefined ) {
					aaObj.metadata = {};
				}
				
				aaObj.metadata.csmaConfigPath = pluginObj.metadata[ 'ConfigUrl' ];
				aaObj.metadata.csmaPluginPath = pluginObj.metadata[ 'XapUrl' ] || aaObj.metadata.csmaPluginPath;
				
				pluginsDict[ pluginObj.name ] = aaObj;
			} else if( pluginObj.name == 'Conviva') {
				//pluginObj.metadata['namespace'] = 'http://www.conviva.com';
				pluginsDict[ pluginObj.name ] = pluginObj;
			} else {
				//Overwrite any in page plugins
				pluginsDict[ pluginObj.name ] = pluginObj;
			}
		}
	}

}
