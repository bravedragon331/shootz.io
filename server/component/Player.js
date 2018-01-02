
const config = require('../../common/config.js');
var Entity = require('./Entity.js');
var Bullet = require('./Bullet.js');
var global = require('../global');
var players = global.Player;

////////////// Player /////////////////
module.exports = function(param){
	var self = Entity(param);
	self.username = param.username;		
	self.pressingLeft = false;
	self.pressingRight = false;
	self.mouseAngle = 0;

	
	//stats
	self.hpMax = config.initialHp;
	self.hp = config.initialHp;
	self.score = 0;
	self.reloadSpd = 1.5; //per second
	
	self.bulletSpd = 20;
	self.bulletRange = 80;
	self.bulletDmg = 12;
	self.radius = 30;
	
	self.dashTime=10;
	self.dashReload=20;
	self.dashSpd = 10;
	self.normalSpd =10;
	
	self.maxSpd = self.normalSpd;
	
	self.timer1 = 0;
	self.timer2 = 0;
	self.timer3 = 0;
	
	//class
	self.classtype = 'warrior';
	self.level = 1;
	
	//check collision when spawn
	
	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		
		super_update();
		
		if (self.timer1>0){
			self.timer1++;
			if (self.timer1>40/self.reloadSpd)
				self.timer1=0;
		}
		
		if (self.maxSpd<self.normalSpd)
			self.maxSpd=self.normalSpd;
		
		if(self.pressingLeft){
			if (self.timer1==0){
				self.shootBullet(self.mouseAngle);
				self.timer1++;
			}
		}		
		else if(self.pressingRight){
			if (self.timer3<self.dashTime){
				self.maxSpd=self.dashSpd+self.normalSpd;
				self.timer3++;
			}
		}
		
		if (self.timer3>0){
			self.timer3++;
			if (self.timer3>self.dashTime && self.maxSpd!=0)
				self.maxSpd=self.normalSpd;
			if (self.timer3>self.dashReload+self.dashTime)
				self.timer3=0;
		}
		
		if (self.timer2++>20){
			self.timer2=0;
			if (self.hp<self.hpMax)
				self.hp++;
			else if (self.hp>self.hpMax)
				self.hp=self.hpMax;
		}
		
		//collision
		for(var i in players.list){
			var p = players.list[i];
			if(self.map === p.map && self.id !=p.id && self.getDistance(p) < self.radius+p.radius){
				if (self.spdX){
					if (self.x<p.x)
						self.x-=Math.abs(self.spdX*1.3);
					else
						self.x+=Math.abs(self.spdX*1.3);
				}
				if (self.spdY){
					if (self.y<p.y)
						self.y-=Math.abs(self.spdY*1.3);
					else
						self.y+=Math.abs(self.spdY*1.3);
				}
			}

		}		
	}
	
	self.shootBullet = function(angle){
		Bullet({
			parent:self.id,
			angle:angle,
			x:self.x+Math.cos(angle/180*Math.PI) * self.radius*1.5,
			y:self.y+Math.sin(angle/180*Math.PI) * self.radius*1.5,
			map:self.map,
			bulletSpd:self.bulletSpd,
			bulletRange:self.bulletRange,
		});
	}
	self.died = function(){		
		self.x = Math.random() * config.mapWIDTH;
		self.y = Math.random() * config.mapHEIGHT;
		self.map = "menu";
	}
	self.changeLvl = function(){
		if (self.level<=10){
			self.level=(self.score-self.score%100)/100+1;
			
			if (self.level>10)
				self.level=10;
			
			self.reloadSpd = 3+(self.level-1)*0.15; //per second
			self.normalSpd = 10-(self.level-1)*0.15;
			self.hpMax = config.initialHp+(self.level-1)*3;
		}
	}
	self.updateSpd = function(){
		self.spdX = Math.cos(self.mouseAngle/180*Math.PI) * self.maxSpd;
		self.spdY = Math.sin(self.mouseAngle/180*Math.PI) * self.maxSpd;
	}
		
	players.list[self.id] = self;	
	return self;
}
