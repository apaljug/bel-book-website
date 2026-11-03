class player{
	 constructor(x, y, l, h) {
      this.x = x || 0;
      this.y = y || 0;
      this.l = l || canvas.width/22;
      this.h = h || canvas.height/15;
      this.vitesseX = 0; 
      this.vitesseY = 0; 
      this.vitesseMax = 2;
	  this.img = images["01R"];
	  this.hit = false;
	  this.score = 0;
	  this.life = 3;
	  this.retry = 3;
	  this.opacity = 1;
	  this.moving = false;
	  this.fall = false;
	  this.jump = false;
	  this.climb = false;
	  this.attack = false;
	  this.marteau = false;
	  this.onPlatform = true;
	  this.dead = false;
	  this.endD = -1;
    }
    rest(){
		this.img = images["01R"];
		this.hit = false;
		this.opacity = 1;
		this.moving = false;
		this.jump = false;
		this.climb = false;
		this.fall = false;
		this.dead =false;
		this.x = actualLevel.startx;
		this.y= actualLevel.starty;
		this.endD = -1;
		tonneaux = [];
		tonneauxBleu = [];
		dKong.wait = 0;
		dKong.atk = false;
		dKong.megaatk = false;
	}
	
	stop(){
		if(this.moving && (this.vitesseX == 0 && this.vitesseY == 0) || this.climb){
					joueur.moving = false;
				}
	}
	
	attack(){
		this.attack =true;
	}
	
    draw(ctx) {
		ctx.save();
		if(500 == invulnerability){
			joueur.hit = false;
			invulnerability = 0;
			joueur.opacity = 1;
		} else if(joueur.hit){
			invulnerability += 1;
			isInvulnerable();
		}
		ctx.globalAlpha = this.opacity;
		ctx.drawImage(this.img,this.x, this.y,this.l,this.h);
		ctx.restore();
    }
    
    move() {
	if(this.dead){
		isDying();
	}else{
      this.x += this.vitesseX;
      this.y += this.vitesseY;
	  if(this.jump){
		isJumping();
	  }else if(this.vitesseX != 0 && this.move){
		isWalking();
	  }else if(this.climb && this.move){
		isClimbing();
	  }else if (this.attack){
		isattacking();
	  }else{
		isLanding();
	  }
	}
	}
 }

function isJumping(){
	if(joueur.vitesseX > 0 || joueur.img == images["01R"] || joueur.img == images["02R"]){
		joueur.img = images["JR"];
	}else if(joueur.vitesseX < 0 || joueur.img == images["01L"] || joueur.img == images["02L"]){
		joueur.img = images["JL"];
	}
}

function isWalking(){
	if(joueur.vitesseX > 0 &&timeUpdate%10 == 0){
		if(joueur.img == images["01R"]){
			joueur.img = images["02R"];
		}else{	
			joueur.img = images["01R"];
		}
	}else if(timeUpdate%10 == 0){
		if(joueur.img == images["01L"] && timeUpdate%10 == 0){
			joueur.img = images["02L"];
		}else{
			joueur.img = images["01L"];
		}
	}
}

function isLanding(){
	if(joueur.img == images["JR"]){
		joueur.img = images["01R"];
	}else if(joueur.img == images["JL"]){
		joueur.img = images["01L"];
	}
	timeUpdate = 0;
}

function isInvulnerable(){
	if(invulnerability%10 == 0 && joueur.opacity == 1 ){
		joueur.opacity = 0.1;
	}else if(invulnerability%10 == 0){
		joueur.opacity = 1;
	}
}

function isClimbing(){
	if(timeUpdate%10 == 0 && joueur.img == images["02C"]){
		joueur.img = images["01C"];
	}else if(timeUpdate%10 == 0){
		joueur.img = images["02C"];
	}
}

function isDying(){
	if(joueur.endD == 0){
		circle();
	}else if(timeUpdate%3 == 0 && joueur.y > joueur.endD){
		joueur.y -= 2;
	}else if(joueur.y <= joueur.endD){
		joueur.y += 3;
		joueur.endD = 0;
		timeUpdate = 0;
	}
}

function circle(){
	if(canvas.width*3 - timeUpdate*2 >= 1){
		timeUpdate++;
		mid = canvas.width*3 - timeUpdate*2;
		posx = joueur.x+(joueur.l/2)- mid/2;
		posy = joueur.y+(joueur.h/2)- mid/2;
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.fillRect(posx-canvas.width+1, 0, canvas.width, canvas.height);
		ctx.fillRect(posx+mid-1, 0, canvas.width, canvas.height);
		ctx.fillRect(0, posy-canvas.height+1, canvas.width, canvas.height);
		ctx.fillRect(0, posy+ mid-1, canvas.width, canvas.height);
		ctx.drawImage(images["Dcircle"],posx,posy,mid,mid);
		ctx.restore();
	}else{
		game = false;
		timeUpdate = 0;
		startGame();
	}
}

function AnimJump() {
  if (!joueur.fall) {
    if (joueur.y <= emp) {
      joueur.vitesseY = 2;
      joueur.fall = true;
    }
  }
  else {
    if (joueur.y >= canvas.scrollHeight	- joueur.h) {
      joueur.y = canvas.scrollHeight;
      joueur.vitesseY = 0;
      joueur.jump = false;
      joueur.fall = false;
    }
  }
}

function AnimClimb(dir){
	if(dir && joueur.vitesseX == 0){
		if (joueur.climb) {
					if (joueur.y + joueur.vitesseY <= ladder) {
						joueur.climb = false;
						joueur.vitesseY = 0;
						joueur.y = ladder - joueur.h;
						joueur.img = images["01R"];
						joueur.moving = false;
					}else{
						joueur.moving = true;
						joueur.y -= 5;
					}
		}
		else if (ladder != -1 && ladder < joueur.y && !joueur.jump && joueur.vitesseX == 0) {
			joueur.jump = false;
			joueur.fall = false;
			joueur.climb = true;
			emp = joueur.y;
			joueur.vitesseY = 0;
			joueur.y -= 2;
			joueur.x = xladder;
		}
	}else{
		if (joueur.climb && joueur.vitesseX == 0) {
			if (joueur.y + joueur.h + joueur.vitesseY >= endladder) {
				joueur.climb = false;
				joueur.vitesseY = 0;
				joueur.y = endladder - joueur.h;
				joueur.img = images["01R"];
				joueur.moving = false;
			}
			else {
				joueur.moving = true;
				joueur.y += 2;
			}
		}
		else if (ladder > joueur.y && joueur.vitesseX == 0) {
			joueur.climb = true;
			joueur.jump = false;
			joueur.fall = false;
			joueur.vitesseY = 0;
			joueur.y += 2;
			joueur.x = xladder;
		}
	}
}
