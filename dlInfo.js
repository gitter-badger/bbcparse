/*

dlInfo.js

*/

var nitro = require('./nitroCommon');
var helper = require('./apiHelper');
//var xmlToJson = require('./xmlToJson');
var xmlToJson = require('jgeXml/xml2json');

var pid = process.argv[2]; // a version PID (vPID) e.g. b01r5278

var config = require('./config.json');
var mediaSet = config.nitro.mediaset;

var q1 = helper.newQuery();

// http://open.live.bbc.co.uk/mediaselector/5/select/version/2.0/vpid/{vpid}/format/json/mediaset/{mediaSet}/proto/http
// http://open.live.bbc.co.uk/mediaselector/5/select/version/2.0/vpid/b006v299/format/json/mediaset/pc/proto/http

nitro.make_request('open.live.bbc.co.uk','/mediaselector/5/select/version/2.0/vpid/'+pid+
	'/format/json/mediaset/'+mediaSet+'/proto/http','',q1,{},function(obj){

	for (var i in obj.media) {
		var media = obj.media[i];
		console.log(media);
	}
	console.log();

// http://open.live.bbc.co.uk/axs/open/authxml?media_set=pc&version_pid=b006v299&format=xml
	var q2 = helper.newQuery();
	q2.add('media_set',mediaSet)
		.add('version_pid',pid)
		.add('format','xml');

	nitro.make_request('open.live.bbc.co.uk','/axs/open/authxml','',q2,
		{'Accept': 'text/html,application/xhtml+xml,application/xml'},function(obj){
		console.log('Converted from XML');
		console.log(JSON.stringify(xmlToJson.xml2json(obj),null,2));
	});

/*

MANIFEST

<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with Unified Streaming Platform(version=1.7.9) -->
<SmoothStreamingMedia Duration="28864000000" TimeScale="10000000" MinorVersion="0" MajorVersion="2">
<StreamIndex TimeScale="10000000" Url="QualityLevels({bitrate})/Fragments(audio={start time})" Chunks="451" Name="audio" QualityLevels="1" Type="audio">
<QualityLevel FourCC="AACL" AudioTag="255" PacketSize="4" BitsPerSample="16" Channels="2" SamplingRate="48000" CodecPrivateData="1190" Bitrate="320000" Index="0"/>
<c t="0" d="64000000"/>
<c d="64000000"/>
...
<c d="64000000"/>
</StreamIndex>
<Protection>
<ProtectionHeader SystemID="9A04F079-9840-4286-AB92-E65BE0885F95">mgIAAAEAAQCQAjwAVwBSAE0ASABFAEEARABFAFIAIAB4AG0AbABuAHMAPQAiAGgAdAB0AHAAOgAvAC8AcwBjAGgAZQBtAGEAcwAuAG0AaQBjAHIAbwBzAG8AZgB0AC4AYwBvAG0ALwBEAFIATQAvADIAMAAwADcALwAwADMALwBQAGwAYQB5AFIAZQBhAGQAeQBIAGUAYQBkAGUAcgAiACAAdgBlAHIAcwBpAG8AbgA9ACIANAAuADAALgAwAC4AMAAiAD4APABEAEEAVABBAD4APABQAFIATwBUAEUAQwBUAEkATgBGAE8APgA8AEsARQBZAEwARQBOAD4AMQA2ADwALwBLAEUAWQBMAEUATgA+ADwAQQBMAEcASQBEAD4AQQBFAFMAQwBUAFIAPAAvAEEATABHAEkARAA+ADwALwBQAFIATwBUAEUAQwBUAEkATgBGAE8APgA8AEsASQBEAD4AKwBwAG4AaQBJADAALwBVAFMAUQBLAE0AOAA2AGMATwB5AGcAaQArAGwAZwA9AD0APAAvAEsASQBEAD4APABDAEgARQBDAEsAUwBVAE0APgArAFUASgB0ACsATgBrADAAMQBSAGcAPQA8AC8AQwBIAEUAQwBLAFMAVQBNAD4APABMAEEAXwBVAFIATAA+AGgAdAB0AHAAOgAvAC8AcwBsAGQAcgBtAC4AbABpAGMAZQBuAHMAZQBrAGUAeQBzAGUAcgB2AGUAcgAuAGMAbwBtAC8AYwBvAHIAZQAvAHIAaQBnAGgAdABzAG0AYQBuAGEAZwBlAHIALgBhAHMAbQB4ADwALwBMAEEAXwBVAFIATAA+ADwALwBEAEEAVABBAD4APAAvAFcAUgBNAEgARQBBAEQARQBSAD4A</ProtectionHeader>
</Protection>
</SmoothStreamingMedia>

*/

});
