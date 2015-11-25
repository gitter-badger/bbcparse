/*
Nitro API helper functions
*/


function query() {
	this.querystring = '';
	this.add = function(param,value,previous) {
		this.querystring += (this.querystring || previous===true ? '&' : '?')+param;
		if (value) this.querystring += '=' + encodeURIComponent(value);
		return this;
	}
	this.reset = function() {
		this.querystring = '';
		return this;
	}
}

module.exports = {
	newQuery : function(param,value,previous) {
		q = new query();
		if (param) q.add(param,value,previous);
		return q;
	},
	add : function(q,param,value,previous) {
		return q.add(param,value,previous);
	},
	getQueryString : function(q) {
		return q.querystring;
	}
}