//window.onload = function(){
    var WIDTH = window.innerWidth;
    var HEIGHT = window.innerHeight;

    var canvas = document.getElementById("ctx");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    var socket = io();

    //sign
    var signDiv = document.getElementById('signDiv');
    var signDivUsername = document.getElementById('signDiv-username');
    var signDivSignIn = document.getElementById('signDiv-signIn');
    var firstLogin = true;

    //MySelf
    var myPlayer;
    //Temporary Server data, condition variable
    //Player Data
    var serverPlayerData, isSPDNew;
    //Mob Data
    var serverMobData, isMobNew;

    //Prevent lag sprike
    var isStarted = false;

    //Press Mouse flag
    var leftButtonPress = rightButtonPress = false;


    //game
    var Img = {};

    Img.weapon = {};
    Img.weapon['1'] = new Image();
    Img.weapon['1'].src = '/client/img/weapon1.png';

                //white,    yellow,   green,   aqua,    blue,     blue,   notEvenPurple, brown,  black, red
    Img.level = ['#F3F3F3','#F9D790','#4DB866','#5A9A9A','#5170B1','#0084B4','#8E5870','#B5633E','#3B2E25','#9D3246'];

    var ctx = document.getElementById("ctx").getContext("2d");
    ctx.font = '22px sans-serif';


    //Starg Game Logic
    var mapWIDTH = mapHEIGHT = 3000;

    var Entity = function(param){
        var self = {
            x:Math.random()*mapWIDTH,
            y:Math.random()*mapHEIGHT,
            spdX:0,
            spdY:0,
            id:"",
            map:'forest',
            type:"",
            radius:0,
        }
        if(param){
            if(param.x)
                self.x = param.x;
            if(param.y)
                self.y = param.y;
            if(param.map)
                self.map = param.map;
            if(param.id)
                self.id = param.id;
            if(param.type)
                self.type = param.type;
        }
        
        self.update = function(){
            self.updatePosition();
        }
        self.updatePosition = function(){
            if (self.x+self.spdX>=0 && self.spdX<0 || self.x+self.spdX<=mapWIDTH && self.spdX>0)
                self.x += self.spdX;
        
            if (self.y+self.spdX>=0 && self.spdY<0 || self.y+self.spdY<=mapHEIGHT && self.spdY>0)
                self.y += self.spdY;
        }
        self.getDistance = function(pt){
            return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
        }
        return self;
    }
    var MyEntity = function(param){
        var self = {
            x: Math.random()*mapWIDTH,
            y: Math.random()*mapHEIGHT,
            id: "",
            map: "forest",
            type: "",
            radius: 0
        }

        if(param){
            if(param.x)
                self.x = param.x;
            if(param.y)
                self.y = param.y;
            if(param.map)
                self.map = param.map;
            if(param.id)
                self.id = param.id;
            if(param.type)
                self.type = param.type;
            if(param.radius)
                self.radius = param.radius;
            
        }
        return self;
    }
    var Player = function(param){
        var self = Entity(param);
        self.username = param.username?param.username:'';
        self.hp = param.hp?param.hp:24;
        self.hpMax = param.hpMax?param.hpMax:24;
        self.score = param.score?param.score:0;
        self.bulletDamage = param.bulletDamage? param.bulletDamage:12;
        self.level = param.level? param.level:1;
        self.mouseAngle = param.mouseAngle?param.mouseAngle:0;
        self.radius = 30;
        self.normalSpd = param.normalSpd?param.normalSpd/2:5;
        self.maxSpd = param.maxSpd?self.maxSpd/2:self.normalSpd;    
        self.timer1 = 0;
        self.reloadSpd = 3; //per second

        self.draw = function(){
            //var x = -self.x + WIDTH/2;
            var x = self.x - myPlayer.x + WIDTH/2;
            var y = self.y - myPlayer.y + HEIGHT/2;
            
            if (!(x>-100 && x<WIDTH+100 && y>-100 && y<HEIGHT+100))
                return;
                
            var hpWidth = 70 * self.hp / self.hpMax;
            ctx.fillStyle = '#D53C50';
            ctx.fillRect(x - hpWidth/2,y + 40,hpWidth,10);			
            
            ctx.beginPath();
            ctx.arc(x,y,30,0,2*Math.PI);
            ctx.fillStyle = Img.level[self.level-1];
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#2F2E34';
            ctx.stroke();
            
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#F3F3F3';
            ctx.textAlign="center"; 
            ctx.fillText(self.username,x,y-40);        
            //draw Weapon
            drawRotatedImage(Img.weapon["1"], x, y, self.mouseAngle);
        }

        var super_update = self.update;
        self.update = function(){
            self.updateSpd();
            super_update();
            if(self.maxSpd < self.normalSpd){
                self.maxSpd = self.normalSpd;
            }

            //collision
            for(var i in Player.list){
                var p = Player.list[i];
                if(self.map === p.map && self.id !=p.id && self.getDistance(p) < self.radius+p.radius){
                    if (self.spdX){
                        if (self.x<p.x)
                            self.x-=Math.abs(self.spdX*1.2);
                        else
                            self.x+=Math.abs(self.spdX*1.2);
                    }
                    if (self.spdY){
                        if (self.y<p.y)
                            self.y-=Math.abs(self.spdY*1.2);
                        else
                            self.y+=Math.abs(self.spdY*1.2);
                    }
                }
            }

            //collision with Mob
            for(var i in Mob.list){
                var p = Mob.list[i];
                if(p.type == "food") continue;
                if(self.map === p.map && self.getDistance(p) < self.radius+p.radius){
                    if (self.spdX){
                        if (self.x<p.x)
                            self.x-=Math.abs(self.spdX*1.2);
                        else
                            self.x+=Math.abs(self.spdX*1.2);
                    }
                    if (self.spdY){
                        if (self.y<p.y)
                            self.y-=Math.abs(self.spdY*1.2);
                        else
                            self.y+=Math.abs(self.spdY*1.2);
                    }
                }
            }
        }

        self.updateSpd = function(){
            self.spdX = Math.cos(self.mouseAngle/180*Math.PI) * self.maxSpd;
            self.spdY = Math.sin(self.mouseAngle/180*Math.PI) * self.maxSpd;
        }
        
        Player.list[self.id] = self;
        return self;
    }

    Player.list = {};

    Player.draw = function(){
        for(var i in Player.list){
            if(Player.list[i].id == myPlayer.id) continue;
            Player.list[i].draw();
        }
    }
    ///////// Pig
    var Mob = function(param){
        var self = Entity(param);
        self.id = param.id;
        self.x = param.x;
        self.y = param.y;
        self.map = param.map;
        self.type = param.type;
        self.radius = param.radius;

        self.toRemove = false;
        var super_update = self.update;
        
        self.draw = function(){
            if(myPlayer.map !== self.map)
                return;
            
            var x = self.x - myPlayer.x + WIDTH/2;
            var y = self.y - myPlayer.y + HEIGHT/2;
                
            ///
            if (x>-100 && x<WIDTH+100 && y>-100 && y<HEIGHT+100){
                if (self.type=="food"){
                    ctx.beginPath();
                    ctx.arc(x,y,10,0,2*Math.PI);
                    ctx.fillStyle = '#FEC8E0';
                    ctx.fill();
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = '#2F2E34';
                    ctx.stroke();
                }
                else if (self.type=="stone") {
                    ctx.beginPath();
                    ctx.arc(x,y,50,0,2*Math.PI);
                    ctx.fillStyle = '#777C80';
                    ctx.fill();
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = '#2F2E34';
                    ctx.stroke();
                }
                else if (self.type=="cow") {
                    ctx.beginPath();
                    ctx.arc(x,y,30,0,2*Math.PI);
                    ctx.fillStyle = '#C5343B';
                    ctx.fill();
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = '#2F2E34';
                    ctx.stroke();
                }
            }
        }
        
        self.update = function(){
            super_update();
        }

        Mob.list[self.id] = self;		
        return self;
    }
    Mob.list = {};

    //////////

    //////////////Bullet
    var Bullet = function(param){
        var self = Entity(param);
        self.id = param.id?param.id:Math.random();    
        self.angle = param.angle;
        self.bulletSpd = param.bulletSpd?param.bulletSpd:10;
        self.bulletRange = param.bulletRange?param.bulletRange:80;    
        self.spdX = Math.cos(param.angle/180*Math.PI) * self.bulletSpd;
        self.spdY = Math.sin(param.angle/180*Math.PI) * self.bulletSpd;
        self.parent = param.parent;
        self.radius = 15;    
        self.timer = 0;
        self.toRemove = false;
        var super_update = self.update;

        self.update = function(){
            if(self.timer++ > self.bulletRange/self.bulletSpd*5)
                self.toRemove = true;
            super_update();

            var shooter = Player.list[self.parent];
            
            //Collision
            for(var i in Player.list){
                var p = Player.list[i];
                if(self.map === p.map && self.getDistance(p) < p.radius+self.radius && self.parent !== p.id){
                    self.toRemove = true;
                }
            }
            for(var i in Mob.list){
                var p = Mob.list[i];
                if(p.type == "food") continue;
                if(self.map === p.map && self.getDistance(p) < p.radius+self.radius && self.parent !== p.id){
                    self.toRemove = true;
                }
            }
        }

        self.draw = function(){
            if(myPlayer.map !== self.map)
                return;
            
            var x = self.x - myPlayer.x + WIDTH/2;
            var y = self.y - myPlayer.y + HEIGHT/2;
            
            if (x>-100 && x<WIDTH+100 && y>-100 && y<HEIGHT+100){
                ctx.beginPath();
                ctx.arc(x,y,15,0,2*Math.PI);
                ctx.fillStyle = Img.level[Player.list[self.parent].level-1];
                ctx.fill();
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#2F2E34';
                ctx.stroke();
            }
        }

        Bullet.list[self.id] = self;
        return self;
    }
    Bullet.list = {};

    Bullet.update = function(){        
        for(var i in Bullet.list){
            var bullet = Bullet.list[i];        
            bullet.update();        
            if(bullet.toRemove){
                delete Bullet.list[i];            
            }
        }
    }

    Bullet.draw = function(){
        for(var i in Bullet.list){
            var bullet = Bullet.list[i];
            bullet.draw();
        }
    }

    ///////////////////


    setInterval(/*async */function(){    
        //Prevent lag spike
        if(!isStarted) return;
        ///////////////// Player //////////////////////
        if(myPlayer == null && serverPlayerData && serverPlayerData[socket.id]){
            myPlayer = Player(serverPlayerData[socket.id]);
        }
        if(myPlayer == null)
            return;
        
        if (WIDTH!=window.innerWidth || HEIGHT!=window.innerHeight){
            WIDTH=window.innerWidth;
            HEIGHT=window.innerHeight;
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            ctx.font = '22px Arial';
        }
        ctx.clearRect(0,0,WIDTH,HEIGHT);    
        drawMap();
            
        var oldPlayerList = Player.list;    
        for(var i in serverPlayerData){        
            var id = serverPlayerData[i].id;
            var param = serverPlayerData[i];        
            if(serverPlayerData[i].id == myPlayer.id){
                myPlayer.update();
                myPlayer.x = (myPlayer.x*0.2+ param.x*0.8);
                myPlayer.y = (myPlayer.y*0.2 + param.y*0.8);
                myPlayer.score = param.score;
                myPlayer.map = param.map;
                myPlayer.hp = param.hp;
                myPlayer.level = param.level;
            }
            else if(oldPlayerList[id]){
                Player.list[id].mouseAngle =  serverPlayerData[i].mouseAngle;
                Player.list[id].update();            
                Player.list[id].x = (Player.list[id].x*0.2 + param.x*0.8);
                Player.list[id].y = (Player.list[id].y*0.2 + param.y*0.8);
                Player.list[id].score = serverPlayerData[i].score;
                Player.list[id].level = serverPlayerData[i].level;
                Player.list[id].hp = serverPlayerData[i].hp;
                Player.list[id].hpMax = serverPlayerData[i].hpMax;
            }
            else{
                var newPlayer = Player(param);
            }

            if(!oldPlayerList[myPlayer.id])
                Player(param);
        }

        //Erase deleted player
        for(var i in Player.list){
            if(serverPlayerData[Player.list[i].id] == null || serverPlayerData[Player.list[i].id].map == "menu"){
                delete Player.list[i];            
            }
        }
        
        drawLeaderboard();

        Player.draw();  
        myPlayer.draw();  
        
        if(isMobNew == true){
            Mob.list = {};
            for(var i in serverMobData){
                var newMob = Mob(serverMobData[i]);
                newMob.draw();
            }
            isMobNew = false;
        }
        else{
            for(var i in Mob.list){
                var nextMob = Mob.list[i];
                if(nextMob.type != "food"){
                    nextMob.draw();
                }                
                else{
                    nextMob.update();
                    if(nextMob.toRemove){
                        delete Mob.list[i];
                    }
                    nextMob.draw();
                }
            }
        }    

        Bullet.draw();    
        if(myPlayer.map=="menu"){
            homeDiv.style.display = 'inline-block';
            gameDiv.style.display = 'none';
            if (myPlayer.score > 0){
                spawnMessage.style.display = 'inline-block';
                spawnMessage.innerHTML = "You'll spawn with +" + myPlayer.score + ' score!';
            }
        }
        else if(myPlayer.map == "forest"){
            homeDiv.style.display = 'none';
            gameDiv.style.display = 'inline-block';
            firstLogin = false;
            signDivSignIn.innerHTML = "Play";
        }
    }, 20);

    var drawMap = function(){
        //var player = Player.list[selfId];
        var player = myPlayer;
        var x = WIDTH/2 - player.x;
        var y = HEIGHT/2 - player.y;
        
        ctx.fillStyle="#6666FF";
        ctx.fillRect(x,y,3000,3000);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5b5be5';
        
        var times;
        if (WIDTH>HEIGHT)
            times = WIDTH + 50;
        else
            times = HEIGHT + 50;
            
        for (var i=0; i<times; i+=50){
            ctx.beginPath();
            ctx.moveTo(-player.x%50+i, 0);
            ctx.lineTo(-player.x%50+i, HEIGHT);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, -player.y%50+i);
            ctx.lineTo(WIDTH, -player.y%50+i);
            ctx.stroke();
        }
    }

    var drawLeaderboard = function(){
        drawLeaderboard.list = [];
        var temp,j=0,leaderboardHeight;
        for(var i in Player.list){
            if (myPlayer.map==Player.list[i].map){
                drawLeaderboard.list[j] = Player.list[i];
                j++;
            }
        }
        for(var i = 0 ; i < drawLeaderboard.list.length; i++){
            for(var j = i+1 ; j < drawLeaderboard.list.length; j++){
                if (drawLeaderboard.list[i].score<drawLeaderboard.list[j].score){
                    temp=drawLeaderboard.list[i];
                    drawLeaderboard.list[i]=drawLeaderboard.list[j];
                    drawLeaderboard.list[j]=temp;
                }
            }
        }
        
        //set Leaderboard height
        if (drawLeaderboard.list.length<10)
            leaderboardHeight=drawLeaderboard.list.length*20+60;
        else
            leaderboardHeight=10*20+60;
        
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#333';
        ctx.fillRect(WIDTH-230,10,220,leaderboardHeight);
        ctx.globalAlpha = 1.0;
        
        
        ctx.font = 'bold 24px sans-serif';
        
        ctx.textAlign="left"; 
        ctx.fillStyle = '#F3F3F3';
        ctx.fillText("Leaderboard",WIDTH-195,40);
        ctx.font = 'bold 15px sans-serif';
        for (var i=0; i<drawLeaderboard.list.length && i<10; i++){
            if(drawLeaderboard.list[i].id == myPlayer.id){
                ctx.fillText(i+1+". "+drawLeaderboard.list[i].username +" ("+myPlayer.score+")",WIDTH-210,20*(i)+70);
            }
            else{
                ctx.fillText(i+1+". "+drawLeaderboard.list[i].username +" ("+drawLeaderboard.list[i].score+")",WIDTH-210,20*(i)+70);
            }
            
        }
        ctx.fillText("Score: "+myPlayer.score+"  Level: "+myPlayer.level,WIDTH-210,leaderboardHeight+30);
        
    }

    function drawRotatedImage(image, x, y, angle) {
        // save the current co-ordinate system 
        // before we screw with it
        ctx.save(); 
        
        // move to the middle of where we want to draw our image
        ctx.translate(x, y);
        
        // rotate around that point, converting our 
        // angle from degrees to radians 
        ctx.rotate(angle * Math.PI/180);
        
        // draw it up and to the left by half the width
        // and height of the image 
        ctx.drawImage(image, -(image.width/2), -(image.height/2));
        
        // and restore the co-ords to how they were when we began
        ctx.restore(); 
    }

    document.onmousedown = function(event){
        if (event.button < 2)
            socket.emit('keyPress',{inputId:'leftButton',state:true});
        else
            socket.emit('keyPress',{inputId:'rightButton',state:true});
    }
    document.onmouseup = function(event){
        if (event.button < 2)
            socket.emit('keyPress',{inputId:'leftButton',state:false});
        else
            socket.emit('keyPress',{inputId:'rightButton',state:false});
    }
    document.onmousemove = function(event){
        var x = -WIDTH/2 + event.clientX;
        var y = -HEIGHT/2 + event.clientY;
        var angle = Math.atan2(y,x) / Math.PI * 180;
        socket.emit('keyPress',{inputId:'mouseAngle',state:angle});
        if(!myPlayer) return;
        myPlayer.mouseAngle = angle;
    }

    var count = 0;

    //initSocket.connect();

    var initSocket = {
        connect: function(){        
            socket.on('signInResponse',function(data){
                if(data.success){
                    homeDiv.style.display = 'none';
                    gameDiv.style.display = 'inline-block';
                    firstLogin = false;
                    signDivSignIn.innerHTML = "Play";
                    socket.id = data.id;
                    isStarted = true;
                }
                else
                    alert("Sign in unsuccessul.");
            });
            socket.on('sendData', function(data){
                serverPlayerData = data.player;
                serverMobData = data.mob;
                isMobNew = true;
                Bullet.list = {};
                for(var i in data.bullet){
                    if(Player.list[data.bullet[i].parent] == null) return;
                    Bullet(data.bullet[i]);
                }
            })
            // socket.on('player', function(data){
            //     serverPlayerData = data;
            // });
            // //Draw Mob Data
            // socket.on('mob', function(data){
            //     serverMobData = data;
            //     isMobNew = true;
            // });
            // //Bulet
            // socket.on('bullet', function(data){
            //     Bullet.list = {};
            //     for(var i in data){
            //         //if(data[i].parent == myPlayer.id) return;
            //         if(Player.list[data[i].parent] == null) return;
            //         // data[i].x = Player.list[data[i].parent].x+Math.cos(Player.list[data[i].parent].mouseAngle/180*Math.PI) * Player.list[data[i].parent].radius*1.5;
            //         // data[i].y = Player.list[data[i].parent].y+Math.cos(Player.list[data[i].parent].mouseAngle/180*Math.PI) * Player.list[data[i].parent].radius*1.5;
            //         // data[i].angle = Player.list[data[i].parent].mouseAngle;
            //         Bullet(data[i]);
            //     }            
            // })
            socket.on('disconnect', function(){
                if(socket.id)
                    delete Player.list[socket.id];
            });
        }
    }

    signDivSignIn.onclick = function(){
        socket.emit('signIn',{username:signDivUsername.value,firstLogin:firstLogin});
        signDivSignIn.innerHTML = "Loading...";
    }

    initSocket.connect();
//}