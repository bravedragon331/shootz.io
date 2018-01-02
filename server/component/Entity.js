
var config = require('../../common/config.js');

module.exports = function(param){	
	var self = {
		x: param.x?param.x:Math.random()*config.mapWIDTH,
		y: param.y? param.y:Math.random()*config.mapHEIGHT,
		map: param.map? param.map:"forest",
		id: param.id? param.id: "",
		type: param.type? param.type: "",
		radius: param.radius? param.radius: 0
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){		
		if (self.x>=0 && self.spdX<0 || self.x<=config.mapWIDTH && self.spdX>0)
			self.x += self.spdX * config.spdScale;
	
		if (self.y>=0 && self.spdY<0 || self.y<=config.mapHEIGHT && self.spdY>0)
			self.y += self.spdY * config.spdScale;
	}
	
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}