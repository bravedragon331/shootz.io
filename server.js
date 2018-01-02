/*
vps152329.vps.ovh.ca
Username: root
Password:  d6NB7YFl
*/

var express = require('express');
var app = express();
var serv = require('http').Server(app);

var global = require('./server/global.js');
var players = global.Player;
var bullets = global.Bullet;
var mobs = global.Mob;

var config = require('./common/config.js');
var Entity = require('./server/component/Entity.js');
var Player = require('./server/component/Player.js');
var Bullet = require('./server/component/Bullet.js');
var Mob = require('./server/component/Mob.js');

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(55);
console.log("Server started.");



players.list = {};
bullets.list = {};
mobs.list = {};

////////////////////////////////////////
var onConnect = function(data, socket){
	//console.log("New Connected");

	var map = 'forest';
	if(data.username == '')
		data.username = "Shootz.io";
	var player = Player({
		username:data.username,
		id:socket.id,
		map:map
	});

	socket.on('keyPress',function(data){
		if(data.inputId === 'leftButton')
			player.pressingLeft = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
		else if(data.inputId === 'rightButton')
			player.pressingRight = data.state;
	});
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	//console.log(socket.id);
	socket.on('signIn', function(data){
		if(data.firstLogin){
			//console.log("firstLogin");
			onConnect(data, socket);
		}
		else{
			//console.log("No first");
			if (data.username=="")
				data.username="Shootz.io";
			if(players.list[socket.id] == undefined) return;
			players.list[socket.id].map="forest";
			players.list[socket.id].username=data.username;
			players.list[socket.id].hp = players.list[socket.id].hpMax;
		}		
		socket.emit('signInResponse', {success:true, map:'forest', username:data.username == ''? "Shootz.io":data.username, id:socket.id});
	});

	socket.on('disconnect', function(){
		if(socket.id)
			delete players.list[socket.id];
		//console.log("Disconnect one");
	})

	//console.log("New Channel");
});

createMob = function(type){
	Mob({
		map:"forest",
		type:type,
	});
}

var startTime = Date.now();
setInterval(function(){
	mobs.update();
	bullets.update();
	players.update();
	//spawn monster
	var Foodcount=0, Stonecount=0, Cowcount=0;
	for(var i in mobs.list){		
		if (mobs.list[i].type=="food"){
			Foodcount++;
		}
			
		else if (mobs.list[i].type=="stone"){
			Stonecount++;			
		}
		
		else if (mobs.list[i].type=="cow"){
			Cowcount++;
		}
	}

	if (Foodcount<50)
		createMob("food");
	if (Stonecount<5)
		createMob("stone");
	if (Cowcount<10)
		createMob("cow");
	var sendData = {
		player: players.list,
		bullet: bullets.list,
		mob: mobs.list
	}
	io.sockets.emit('sendData', sendData);
	/*
	io.sockets.emit('player', players.list);	
	io.sockets.emit('bullet', bullets.list);
	io.sockets.emit('mob', mobs.list);
	*/
	var nowTime = Date.now();
	config.spdScale = (nowTime - startTime)/40;
	startTime = nowTime;
}, 40);
