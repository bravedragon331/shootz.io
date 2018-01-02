const config = require('../../common/config.js');

var Entity = require('./Entity.js');
var global = require('../global');
var players = global.Player;
var bullets = global.Bullet;
var mobs = global.Mob;

var Mob = function(param){
	var self = Entity(param);
	self.id = Math.random();
	self.angle = Math.random()*360;

	self.timer = 0;
	self.timer2 = 0;
	self.dieAfter = 0; //disappear after x/25 seconds
	self.toRemove = false;
	var super_update = self.update;
	
	if (self.type=="stone"){
		self.spd = 0;
		self.radius = 50;
	}
	else if (self.type=="food"){
		self.spd = 0;
		self.radius = 10;
		self.dieAfter = 600; //x/40 per sec
	}
	else if (self.type=="cow"){
		self.spd = 2;
		self.radius = 30;
		self.hp = 20;
	}
	
	self.spdX = Math.cos(self.angle/180*Math.PI) * self.spd;
	self.spdY = Math.sin(self.angle/180*Math.PI) * self.spd;
	
	self.update = function(){
		if (self.dieAfter>0){
			if(self.timer++ > self.dieAfter){
				self.toRemove = true;
				self.timer=0;
			}
		}

		if (self.spd!=0){
			if(self.timer2++ > 100){
				self.angle = Math.random()*360;
				self.spdX = Math.cos(self.angle/180*Math.PI) * self.spd;
				self.spdY = Math.sin(self.angle/180*Math.PI) * self.spd;
				self.timer2=0;
			}
		}
		super_update();
		
		//collision
		
		for(var i in mobs.list){
			var m = mobs.list[i];
			if(self.map === m.map && self.id !=m.id && self.getDistance(m) < self.radius+m.radius){
				if (self.spdX){
					if (self.x<m.x)
						self.x-=Math.abs(self.spdX*1.3);
					else
						self.x+=Math.abs(self.spdX*1.3);
				}
				if (self.spdY){
					if (self.y<m.y)
						self.y-=Math.abs(self.spdY*1.3);
					else
						self.y+=Math.abs(self.spdY*1.3);
				}
				self.timer2=101;
			}
		}
		for(var i in players.list){
			var p = players.list[i];

			if (self.type=="food"){
				if(self.map === p.map && self.getDistance(p) < self.radius+p.radius+30){
					p.score++;
					p.changeLvl();
					self.toRemove = true;
				}
			}
			else if (self.type=="stone"){
				if(self.map === p.map && self.getDistance(p) < self.radius+p.radius){
					if (p.spdX){
						if (p.x<self.x)
							p.x-=Math.abs(p.spdX*1.3);
						else
							p.x+=Math.abs(p.spdX*1.3);
					}
					if (p.spdY){
						if (p.y<self.y)
							p.y-=Math.abs(p.spdY*1.3);
						else
							p.y+=Math.abs(p.spdY*1.3);
					}
				}
			}
			else if (self.type=="cow"){
				if(self.map === p.map && self.getDistance(p) < self.radius+p.radius){
					if (p.spdX){
						if (p.x<self.x)
							p.x-=Math.abs(p.spdX*1.3);
						else
							p.x+=Math.abs(p.spdX*1.3);
					}
					if (p.spdY){
						if (p.y<self.y)
							p.y-=Math.abs(p.spdY*1.3);
						else
							p.y+=Math.abs(p.spdY*1.3);
					}
					self.timer2=101;
				}
			}			
		}
		
		for(var i in bullets.list){
			var b = bullets.list[i];
			if (self.type=="stone"){
				if(self.map === b.map && self.getDistance(b) < self.radius+b.radius){
				b.toRemove = true;
				}
			}
			else if (self.type=="cow"){
				if(self.map === b.map && self.getDistance(b) < self.radius+b.radius){					
					if(players.list[b.parent] != undefined)
						self.hp -= players.list[b.parent].bulletDmg;
					
					if (self.hp<=0){
						for (var i=0; i<5; i++)
							self.createFood();
						
						self.toRemove=true;
					}
					b.toRemove = true;
				}
			}
		}
	}
	self.createFood = function(type){
		Mob({
			map:"forest",
			type:"food",
			x:self.radius*(Math.random()*4-2)+self.x,
			y:self.radius*(Math.random()*4-2)+self.y,
		});
    }
    
		
	mobs.list[self.id] = self;
	return self;
}
module.exports = Mob;