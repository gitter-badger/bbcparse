/*
Nitro API helper functions
*/


function query() {
	this.querystring = '';
	this.add = function(param,value,previous) {
		this.querystring += (this.querystring || previous===true ? '&' : '?')+param;
		if (value) this.querystring += '=' + encodeURIComponent(value);
		return this;
	};
	this.reset = function() {
		this.querystring = '';
		return this;
	};
	this.clone = function() {
		var newQ = new query();
		newQ.querystring = this.querystring;
		return newQ;
	}
}

module.exports = {
	newQuery : function(param,value,previous) {
		q = new query();
		if (param) q.add(param,value,previous);
		return q;
	},
	queryFrom : function(url,previous) {
		q = new query();
		if (url.indexOf('?')>=0) {
			url = url.split('?')[1];
		}
		else if (url.indexOf('&')>=0) {
			url = url.split('&')[1];
		}
		q.querystring = ((previous ? '&' : '?')+url);
		return q;
	},
	add : function(q,param,value,previous) {
		return q.add(param,value,previous);
	},
	getQueryString : function(q) {
		return q.querystring;
	},
	clone : function(q) {
		return q.clone();
	}
};