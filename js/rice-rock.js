var width = 800;
var height = 600;
var score = 0;
var lives = 3;
var time = 0;
var started = false;
//rocks and misiles (sets);
var rock_group = [];
var missile_group = [];
var explosion_group = [];
var timer = "undefined";
var asteroid_info;
var keydown = {};
var FPS = 60;
var extra_size = 40;




window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / FPS);
    };
})();

function onload() {
    width = window.innerWidth;
    height = window.innerHeight;
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    
    
    
    
   // function drawStroked(text, x, y) {
        ctx.font = "40px Sans-serif"
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 8;
       // ctx.strokeText(text, x, y);
        ctx.fillStyle = 'white';
        //ctx.fillText(text, x, y);
    //}
    
    //drawStroked("37°", 50, 150);
    
    function ImageInfo( center, size, radius, lifespan , animated) {
        var self = this;
        self.center = center;
        self.size = size;
        self.radius = typeof radius !== "undefined" ? radius : 0;
        if (typeof radius !== "undefined")
            self.lifespan = lifespan;
        else
            self.lifespan = Number.POSITIVE_INFINITY;
        self.animated = typeof animated !== "undefined" ? animated : false;

        self.get_center = function(){
            return self.center;
        };

        self.get_size = function(){
            return self.size;
        };

        self.get_radius = function(){
            return self.radius;
        };

        self.get_lifespan = function(){
            return self.lifespan;
        }

        self.get_animated = function() {
            return self.animated;
        }
    }



    var debris_info = new ImageInfo([320, 240], [640, 480]);
    var debris_image = new Image();
    debris_image.src = "./img/debris2_blue.png";

    var nebula_info = new ImageInfo([400, 300], [800, 600]);
    var nebula_image = new Image();
    nebula_image.src = "./img/nebula_blue.png";

    // splash image
    var splash_info = new ImageInfo([200, 150], [400, 300]);
    var splash_image = new Image();
    splash_image.src = "./img/splash.png";

    // ship image
    var ship_info = new ImageInfo([45, 45], [90, 90], 35);
    var ship_image = new Image();
    ship_image.src = "./img/double_ship.png";

    // missile image - shot1.png, shot2.png, shot3.png
    var missile_info = new ImageInfo([5,5], [10, 10], 6, 50)
    var missile_image = new Image();
    missile_image.src = "./img/shot2.png";

    // asteroid images - asteroid_blue.png, asteroid_brown.png, asteroid_blend.png
    var asteroid_info = new ImageInfo([45, 45], [90, 90], 40);
    var asteroid_image = new Image();
    asteroid_image.src = "./img/asteroid_blue.png";
    

    // animated explosion - explosion_orange.png, explosion_blue.png, explosion_blue2.png, explosion_alpha.png
    var explosion_info = new ImageInfo([64, 64], [128, 128], 17, 24, true);
    var explosion_image = new Image();
    explosion_image.src = "./img/explosion_alpha.png";

    /*var soundtrack = new Audio("./sound/soundtrack.mp3");
    var missile_sound = new Audio("./sound/missile.mp3");
    //missile_sound.set_volume(0.5)
    var ship_thrust_sound = new Audio("./sound/thrust.mp3");
    var explosion_sound = new Audio("./sound/explosion.mp3");*/
    
    var soundtrack = null;
    var missile_sound = null;
    //missile_sound.set_volume(0.5)
    var ship_thrust_sound = null;
    var explosion_sound = null;

    //soundtrack.play();

    /*nebula_image.onload = function() {
        ctx.drawImage(nebula_image, 0, 0);
    };*/
    
    // helper functions to handle transformations
    var angle_to_vector = function(ang){
        return [Math.cos(ang), Math.sin(ang)];
    };

    var dist = function(p,q) {
        return Math.sqrt(Math.pow((p[0] - q[0]), 2)+Math.pow((p[1] - q[1]), 2));
    };
    


    //Ship class
    function Ship( pos, vel, angle, image, info) {
        var self = this;
        self.pos = [pos[0] ,pos[1]];
        self.vel = [vel[0],vel[1]];
        self.thrust = false;
        self.angle = angle;
        self.angle_vel = 0;
        self.image = image;
        self.image_center = info.get_center();
        self.image_size = info.get_size();
        self.radius = info.get_radius() + extra_size/2;
        

          
        self.get_pos = function(){
            return self.pos;
        }
        
        self.get_radius = function() {
            return self.radius;
        }
               
        self.draw = function(canvas) {
    //        canvas.draw_circle(self.pos, self.radius, 1, "White", "White")
            if(self.thrust) {
                canvas.save();
                canvas.translate(self.pos[0], self.pos[1]);
                canvas.rotate(self.angle);
                canvas.drawImage(self.image,90, 0,self.image_size[0], self.image_size[1], -(self.image_size[0] + extra_size)/2, -(self.image_size[1] + extra_size)/2, self.image_size[0] + extra_size,self.image_size[1] + extra_size/* self.angle*/);
                canvas.restore();
                
            }
            else {
                canvas.save();
                canvas.translate(self.pos[0], self.pos[1]);
                canvas.rotate(self.angle);
                canvas.drawImage(self.image,0,0,self.image_size[0], self.image_size[1], -(self.image_size[0] + extra_size)/2, -(self.image_size[1] + extra_size)/2, self.image_size[0] + extra_size,self.image_size[1] + extra_size/* self.angle*/);
                canvas.restore();
            }
        }
                
        self.set_angle_vel = function(vel){
            self.angle_vel = vel;
        }
            
        self.set_thrust = function(th) {
            self.thrust = th;
            if (self.thrust) {
                //ship_thrust_sound.load();
                //ship_thrust_sound.play();
            } else {
                //ship_thrust_sound.load();
            }
        }
            
        self.shoot = function(){
            //global missile_group
            var forward = angle_to_vector(self.angle);
            var a_missile = new Sprite([self.pos[0] + self.radius * forward[0], self.pos[1] + self.radius * forward[1]], [self.vel[0] + 10 * forward[0], self.vel[1] + 10 * forward[1]], 0, 0, missile_image, missile_info, missile_sound);
            missile_group.push(a_missile);        
            
        }
        self.update = function(){
            var c = 0.06;
            self.angle += self.angle_vel;
            
            //position update
            self.pos[0] = (self.pos[0] + self.vel[0]) % width;
            self.pos[1] = (self.pos[1] + self.vel[1]) % height;
            //friction update
            self.vel[0] *= (1 - c);
            self.vel[1] *= (1 - c);
            //get forward vector
            forward = angle_to_vector(self.angle);
            if (self.thrust) {
                self.vel[0] += forward[0];
                self.vel[1] += forward[1];
            }
        }
    }
    
    
    // Sprite class
    function Sprite(pos, vel, ang, ang_vel, image, info, sound){
        var self = this;
        self.pos = [pos[0],pos[1]];
        self.vel = [vel[0],vel[1]];
        self.angle = ang;
        self.angle_vel = ang_vel;
        self.image = image;
        self.image_center = info.get_center();
        self.image_size = info.get_size();
        self.radius = info.get_radius();
        self.lifespan = info.get_lifespan();
        self.animated = info.get_animated();
        self.age = 0;
        
        sound = typeof sound !== "undefined" ? sound : false;
        if (sound){
            //sound.load();
            //sound.play();
        }
                
        self.get_pos = function() {
            return self.pos;
        }
        
        self.get_radius = function(){
            return self.radius;
        }
        
        self.collide = function(other_object){
            other_object_rad = other_object.get_radius();
            other_object_pos = other_object.get_pos();
            min_collide_dist = other_object_rad + self.radius;
            distance = dist(other_object_pos, self.pos);
            if (distance <= min_collide_dist)
                return true;
            else
                return false;
        }
                   
        self.draw = function( canvas){
            if (!self.animated) {
                canvas.save();
                canvas.translate(self.pos[0], self.pos[1]);
                canvas.rotate(self.angle);
                canvas.drawImage(self.image, 0,0, self.image_size[0], self.image_size[1], - self.image_size[0]/2, - self.image_size[1]/2,self.image_size[0], self.image_size[1]);
                canvas.restore();
            } else {
                im_center = [self.image_center[0] * self.age + (self.age + 1) * self.image_center[0], self.image_center[1]]
                //print im_center
                canvas.drawImage(self.image, im_center[0] - self.image_size[0]/2,im_center[1] - self.image_size[1]/2, self.image_size[0],  self.image_size[1], self.pos[0] - self.image_size[0]/2, self.pos[1]-self.image_size[1]/2, self.image_size[0], self.image_size[1]);
            }
        }
       
        self.update = function() {
            self.angle += self.angle_vel;
            self.pos[0] += self.vel[0];
            self.pos[1] += self.vel[1];
            self.age += 1;  
            if (self.age >= self.lifespan)
                return true;
            else
                return false;
        }
    }
    
    // mouseclick handlers that reset UI and conditions whether splash image is drawn   

        
    function process_sprite_group(sprite_group, canvas){
        for (sprite in sprite_group) {
            //console.log({"sprite" : sprite_group[sprite]});
            sprite_group[sprite].draw(canvas);
            if (sprite_group[sprite].update()) {
                sprite_group.splice(sprite, 1);
            }
        }
    }
           
    function group_collide(group, other_object) {
        var count = 0;
        for (sprite in group) {
            if (group[sprite].collide(other_object)) {
                var a_explosive = new Sprite(group[sprite].get_pos(), [0, 0], 0, 0, explosion_image, explosion_info);
                explosion_group.push(a_explosive);
                group.splice(sprite, 1);
                count += 1;
            }
        }
                        
        return count;
    }
    
    /**
     * Returns a random number between min (inclusive) and max (exclusive)
     */
    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function group_group_collide(rocks_group, missile_group) {
        var collision_count = 0;
        for (missile in missile_group) {
            collision_count += group_collide(rocks_group, missile_group[missile]);
        }
        return collision_count;
    }
                       
    // timer handler that spawns a rock

    function rock_spawner() {
        //global rock_group;
        //console.log("spawning rocks");
        var rock_pos = [getRandomInt(0, width), getRandomInt(0, height)]
        var rock_vel = [Math.random() * .6 - .3, Math.random() * .6 - .3]
        var rock_avel = Math.random() * .2 - .1
        console.log(asteroid_info);
        if (rock_group.length <= 12) {
            var a_rock = new Sprite(rock_pos, rock_vel, 0, rock_avel, asteroid_image, asteroid_info);
            rock_group.push(a_rock);
        }
    }
                    
    function start(){
        //global started, score, lives
        if (!started) {
            started = true;
            score = 0;
            lives = 3;
            if("undefined" !== timer) 
                clearInterval(timer);
            timer = setInterval(rock_spawner, 1000);
            
            
        }
    }

    function keydown_handler(key) {
        console.log({"key":key.keyCode});
        key.preventDefault();
        if (key.keyCode == 37 && keydown['37'] == null) {
            my_ship.set_angle_vel(-0.15);
            keydown['37'] = true;
        }
        if (key.keyCode == 39 && keydown['39'] == null) {
            my_ship.set_angle_vel(0.15);
            keydown['39'] = true;
        }
        if (key.keyCode == 38 && keydown['38'] == null) {
            my_ship.set_thrust(true);
            keydown['38'] = true;
        }
        if (key.keyCode == 13 && keydown['13'] == null) {
            if(!started) start();
            else 
                my_ship.shoot();
            keydown['13'] = true;
        }
            
    }
                    
    function keyup_handler(key) {
        key.preventDefault();
        if (key.keyCode == 37 || key.keyCode == 39)
            my_ship.set_angle_vel(0);
        if (key.keyCode == 38)
            my_ship.set_thrust(false);
        keydown[key.keyCode] = null;
    }
            
    function restart_game() {
        //global missile_group, rock_group, score, lives, started
        missile_group = [];
        rock_group = [];
        started = false;
        clearInterval(timer);
    }
    
    function draw(canvas){
        //global time, score, lives
        
        // animiate background
        time += 1;
        center = debris_info.get_center();
        size = debris_info.get_size();
        wtime = (time / 8) % center[0];
        //console.log(wtime);
        canvas.drawImage(nebula_image,0,0, nebula_info.get_size()[0], nebula_info.get_size()[1], 0,0, width, height);
        canvas.drawImage(debris_image, 0, 0, (size[0]-2*wtime), size[1], 
                                    (10*wtime), 0, (width-2.5*wtime), height);
        //canvas.drawImage(debris_image, 0, 0, size[0], size[1], 
        //                            0, 0, width, height);
        //canvas.drawImage(debris_image, [size[0]-wtime, center[1]], [2*wtime, size[1]], 
        //                          [1.25*wtime, height/2], [2.5*wtime, height]);
       
        // draw ship 
        my_ship.draw(canvas);
        // update and draw rocks
        process_sprite_group(rock_group, canvas);
        hits = group_collide(rock_group, my_ship);
        lives -= hits;
        // if lives are exhausted restart the game
        if (lives <= 0) {
            live = 0;
            restart_game();
        }
        // update and draw missiles
        process_sprite_group(missile_group,canvas);
        score += group_group_collide(rock_group, missile_group);
        //update and update the exposion_group
        process_sprite_group(explosion_group, canvas);
        // update ship 
        my_ship.update();
        canvas.fillText("Lives", 50, 50);//, 25, "White")    
        canvas.fillText("Score", width - 150, 50);//, 25, "White")
        canvas.fillText(lives, 50, 90);//, 25, "White")
        canvas.fillText(score, width - 150, 90);//, 25, "White")
        
        if (!started) {
            canvas.drawImage(splash_image, 0, 0,
                              splash_info.get_size()[0], splash_info.get_size()[1], width/2 - splash_info.get_size()[0]/2, height/2 - splash_info.get_size()[1]/2, 
                              splash_info.get_size()[0], splash_info.get_size()[1]);
        }
    }
    
    var my_ship = new Ship([width / 2, height / 2], [0, 0], 0, ship_image, ship_info);
    
    function main() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        draw(ctx);
        window.requestAnimFrame(main);
    }
    

    
    
    main();
    
    document.addEventListener("keydown", keydown_handler);
    document.addEventListener("keyup", keyup_handler);
}



