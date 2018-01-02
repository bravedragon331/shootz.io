const config = require('../../common/config.js');
var Entity = require('./Entity.js');
var global = require('../global');
var players = global.Player;
var bullets = global.Bullet;

////// Bulllet ///////////////
module.exports = function(param){
    var self = Entity(param);
    self.id = param.id?param.id:Math.random();    
	self.angle = param.angle;
	self.parent = param.parent;    
    self.bulletSpd = param.bulletSpd?param.bulletSpd:10;
	self.bulletRange = param.bulletRange?param.bulletRange:80;	
	self.spdX = Math.cos(param.angle/180*Math.PI) * self.bulletSpd;
	self.spdY = Math.sin(param.angle/180*Math.PI) * self.bulletSpd;
    self.radius = param.radius?param.radius:15;	
	self.toRemove = param.toRemove;	
	self.timer = 0;

	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > self.bulletRange/self.bulletSpd*5)
			self.toRemove = true;
		super_update();
		for(var i in players.list){
			var p = players.list[i];
			if(self.map === p.map && self.getDistance(p) < p.radius+self.radius && self.parent !== p.id){
				self.toRemove = true;
				if(players.list[self.parent] == null) return;
				players.list[i].hp -= players.list[self.parent].bulletDmg;
				if(players.list[i].hp <= 0){
					players.list[self.parent].score += Math.round(p.score*config.ScoreLose);
					players.list[self.parent].changeLvl();
					players.list[i].died();
					players.list[i].score-=Math.round(players.list[i].score*config.ScoreLose);
					players.list[i].changeLvl();
				}				
			}
		}
	}

	bullets.list[self.id] = self;
	return self;
}