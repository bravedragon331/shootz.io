exports.Player = {
    list:{},
    update: function(){
        for(var i in this.list){
            this.list[i].update();
        }
    }
}

exports.Bullet = {
    list:{},
    update: function(){
        for(var i in this.list){
            this.list[i].update();
            if(this.list[i].toRemove)
                delete this.list[i];
        }
    }
}

exports.Mob = {
    list:{},
    update: function(){
        for(var i in this.list){
            this.list[i].update();
            if(this.list[i].toRemove)
                delete this.list[i];
        }
    }    
}