/*

List programmes by aggregation (category, format, but not tags, they have been removed)

*/

var http = require('http');
var fs = require('fs');
var util = require('util');
var common = require('./common');

var programme_cache = [];
var download_history = [];
var domain = 'radio';
var displayDomain = domain;
var pid = '';

var debuglog = util.debuglog('bbc');

var add_programme = function(obj) {
	programme_cache.push(obj);
}

//-----------------------------------------------------------------------------

function cat_slice_dump(obj) {
	console.log('* Category_slice dump');
	console.log(obj.category_slice.category.key+' = '+obj.category_slice.category.title);
	var len = obj.category_slice.programmes.length;
	//console.log('Contains '+len+' entries');
	for (var i in obj.category_slice.programmes) {
		p = obj.category_slice.programmes[i];
		if ((p.type == 'episode') || (p.type == 'clip'))  {
			add_programme(p);
		}
		else if ((p.type == 'series') || (p.type == 'brand')) {
			common.pid_list(p.type,p,false,add_programme);
		}
		else {
			console.log('Unhandled type: '+p.type);
		}
	}
}

//-----------------------------------------------------------------------------

function cat_page_list(obj) {
    console.log(obj);
	console.log('* Category_page list');
	console.log(obj.category_page.category.key+' = '+obj.category_page.category.title);
	var len = obj.category_page.available_programmes.length;
	console.log('Contains '+len+' entries');
	for (var i in obj.category_page.available_programmes) {
		p = obj.category_page.available_programmes[i];
		if ((p.type == 'episode') || (p.type == 'clip'))  {
			add_programme(p);
		}
		else if ((p.type == 'series') || (p.type == 'brand')) {
			common.pid_list(p.type,p,false,add_programme);
		}
		else {
			console.log('Unhandled type: '+p.type);
			console.log(p);
		}

	}
}

function atoz_list(obj) {
	console.log('A to Z list');
	if (obj.atoz.tleo_titles.length==0) {
		console.log(obj);
	}
	else {
		for (var i in obj.atoz.tleo_titles) {
			title = obj.atoz.tleo_titles[i];
			p = title.programme;
			debuglog(p);
			if ((p.type == 'episode') || (p.type == 'clip'))  {
				add_programme(p);
			}
			else if ((p.type == 'series') || (p.type == 'brand')) {
				common.pid_list(p.type,p,false,add_programme);
			}
			else {
				console.log('Unhandled type: '+p.type);
				console.log(p);
			}
		}
	}	
}

//-----------------------------------------------------------------------------

function pad(str, pad, padRight) {
	if (typeof str === 'undefined')
		return pad;
	if (padRight) {
		return (str + pad).substring(0, pad.length);
	} else {
		return (pad + str).slice(-pad.length);
	}
}

//-----------------------------------------------------------------------------

function pc_dump() {

var hidden = 0;

	console.log('\n* Programme Cache:');
	for (var i in programme_cache) {
		p = programme_cache[i];
		if (download_history.indexOf(p.pid) == -1) {
			title = (p.display_title ? p.display_title.title+
				(p.display_title.subtitle ? '/' : '')+p.display_title.subtitle : p.title);

			position = p.position ? p.position : 1;
			totaleps = 1;
			series = 1;
			parents = '';

			ownership = p.ownership;

			subp = p;
			while ((subp.programme) || (subp.parent)) {
				newp = subp.programme;
				if (!newp) newp = subp.parent.programme;
				subp = newp;
				if (subp.type == 'series') {
					if (subp.expected_child_count) totaleps = subp.expected_child_count;
					if (subp.position) series = subp.position;
				}
				if ((!ownership) && (subp.ownership)) {
					ownership = subp.ownership;
				}
				title = subp.title+'/'+title;
				parents += ' '+subp.type+'='+subp.pid+'('+subp.title+')';
			}

			console.log(p.pid+' '+p.type+' '+(ownership ? ownership.service.type : displayDomain)+' '+
			  ((p.is_available===false||p.is_available_mediaset_pc_sd===false) ? 'Unavailable' : 'Available')+'  '+title);

			len = p.duration ? p.duration : 0;
			if (p.versions) {
				if (!len && (p.versions[0].duration)) {
					len = p.versions[0].duration;
				}
				for (var i in p.versions) {
					parents += '\n vPID='+p.versions[i].pid+'('+p.versions[i].types[0]+')';
				}
			}

			suffix = 's';
			if (len>=60) {
				len = Math.floor(len/60);
				suffix = 'm';
			}
			if (len>=100) {
				len = Math.round(len/60);
				suffix = 'h';
			}

			console.log('  '+len+suffix+' S'+pad(series,'00')+'E'+pad(position,'00')+
				'/'+pad(totaleps,'00')+' '+(p.short_synopsis ? p.short_synopsis : 'No description'));
			if (parents) console.log('   '+parents);

		}
		else {
			//console.log('Hidden '+p.pid);
			hidden++;
		}
	}
	console.log();
	console.log('Cache has '+programme_cache.length+' entries, '+hidden+' hidden');
}

//------------------------------------------------------------------------------

// snaffled from request module
function hasHeader(header, headers) {
	var headers = Object.keys(headers || this.headers),
		lheaders = headers.map(function (h) {return h.toLowerCase()});
	header = header.toLowerCase();
	for (var i=0;i<lheaders.length;i++) {
		if (lheaders[i] === header) return headers[i];
	}
	return false;
}

//------------------------------------------------------------------------------

function request_category(host,path) {
	console.log(host+path);
	var options = {
	  hostname: host
	  ,port: 80
	  ,path: path
	  ,method: 'GET'
	  ,headers: { 'Content-Type': 'application/json' }
	};

	var list = '';
	var cat;

	var req = http.request(options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (data) {
		   list += data;
	  });
	  res.on('end', function() {
		if (res.statusCode >= 300 && res.statusCode < 400 && hasHeader('location', res.headers)) {
			// handle redirects, as per request module
			var location = res.headers[hasHeader('location', res.headers)];
			path = location.split('bbc.co.uk')[1];
			host = location.split('://')[1].split('/')[0];
			request_category(host,path);
		}
		else if (res.statusCode >= 400 && res.statusCode < 500) {
			console.log(res.statusCode+' '+res.statusMessage);
		}
		else try {
			cat = JSON.parse(list);
			if (cat.category_page) {
				cat_page_list(cat);
			}
			else if (cat.category_slice) {
				cat_slice_dump(cat);
			}
			else {
				atoz_list(cat); //tleo_titles
			}
		}
		catch(err) {
			if ((res.statusCode>=400) && (res.statusCode<500)) {
				console.log(res.statusCode+' '+res.statusMessage);
			}
			else {
				console.log('Something went wrong parsing the category JSON');
				console.log(err);
				console.log(res.statusCode+' '+res.statusMessage);
				console.log(res.headers);
				console.log('** '+list);
			}
		};
	   });
	});
	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});
	req.end();
}

//------------------------------------------------------------------------[main]

// http://www.bbc.co.uk/radio/programmes/genres/drama/scifiandfantasy/player.json
// http://www.bbc.co.uk/radio/programmes/genres/drama/player.json
// http://www.bbc.co.uk/radio/programmes/genres/comedy/player.json

// TV mode (partially supported)
// http://bbc.co.uk/programmes/films.json
// redirects to http://open.live.bbc.co.uk/aps/programmes/a-z/by/films/all.json
// http://www.bbc.co.uk/programmes/genres/comedy/spoof.json

var configstr = fs.readFileSync('./config.json', 'utf8');
var config = JSON.parse(configstr);
download_history = common.downloadHistory(config.download_history);

var defcat = 'drama/scifiandfantasy';
var category = defcat;
var page = '/player';

if (process.argv.length>2) {
	category = process.argv[2];
}

if (process.argv.length>3) {
	domain = process.argv[3];
	displayDomain = domain;
	if (domain=='tv') {
		domain = '';
	}
}

cat_prefix = 'genres/';
if (process.argv.length>4) {
	if (process.argv[4] == 'format') {
		cat_prefix = 'formats/';
	}
	else if (process.argv[4] == 'search') {
		if (domain=='radio') {
			//http://www.bbc.co.uk/radio/programmes/a-z/by/doctor%20who/player
			cat_prefix = 'a-z/by/'
			page = '/all';
		}
		else {
			cat_prefix = '';
			page = '';
		}
	}
}
category = cat_prefix + escape(category);

if (process.argv.length>5) {
	pid = process.argv[5];
}

if (category.indexOf('-h')>0) {
	console.log('Usage: '+process.argv[1]+' category domain format|genre|search [PID]');
	console.log();
	console.log('Category defaults to '+defcat);
	console.log('Domain defaults to '+domain);
	console.log('Aggregation defaults to genre');
	console.log('PID defaults to all PIDS');
}
else {
	if (domain) domain = '/'+domain;
	var path = domain+'/programmes/'+category+page+'.json';

	if (!pid) {
		request_category('www.bbc.co.uk',path);
	}
	else {
		obj = [];
		obj.pid = pid; // create a programme object stub
		common.pid_list('toplevel',obj,false,add_programme);
	}
}

process.on('exit', function(code) {
  pc_dump(pid);
});