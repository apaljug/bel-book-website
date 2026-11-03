function testeCollisions() {
  testeCollisionsAvecMurs(joueur);
  testCollisionsEnnemisMurs();
  testCollisionJoueursEnnemis();
  testCollisionJoueursPlatform();
  testCollisionTonneauPlatform();
  testCollisionJoueurEchelle();
  testCollisionsBonusJoueur();
  testCollisionJoueurMarteau();
  tonneaux.forEach((tno) =>{
	testCollisionTonneauEchelle(tno);
  })
}

function testCollisionsEnnemisMurs() {
   tonneaux.forEach((el) => {
     testeCollisionsAvecMurs(el);
   })
   
  joueur.draw(ctx);
  
}

function testCollisionsBonusJoueur(){
	for(i = 0; i < actualLevel.bonusList.length;i++){
		if(rectsOverlap(joueur.x,joueur.y,joueur.l,joueur.h,actualLevel.bonusList[i].x,actualLevel.bonusList[i].y,actualLevel.bonusList[i].l,actualLevel.bonusList[i].h)){
			joueur.score += 100;
			playSound("coin");
			actualLevel.bonusList.splice(i,1);
		}
	}
}

function testeCollisionsAvecMurs(r) {

  if((r.x + r.l) > canvas.width) {
       if(r.vitesseX != 2){
        r.vitesseX = -r.vitesseX;
    }
    if((r.y) >= canvas.height/1.1 && (r.vitesseX == 1 || r.vitesseX == -1)){
            tonneaux.splice(tonneaux.indexOf(r),1);
    }
    r.x = canvas.width - r.l;
  } else if((r.x) < 0) {
    if(r.vitesseX != -2){
        r.vitesseX = -r.vitesseX;
    }
     if((r.y) >= canvas.height/1.1 && (r.vitesseX == 1 || r.vitesseX == -1)){
                tonneaux.splice(tonneaux.indexOf(r),1);
            }
    r.x = 0;
  }
   if(r.vitesseX == -1 || r.vitesseX == 1){
        if((r.y + r.h) >= canvas.height) {
            r.vitesseY = 0;
        }
    }
  if((r.y + r.h) > canvas.height) {
    if(r.fall){
        r.fall = false;
        r.vitesseY = 0;
    }
    r.vitesseY = -r.vitesseY;
    r.y = canvas.height - r.h;
  } else if((r.y) < 0) {
    r.vitesseY = -r.vitesseY;
    r.y = 0;
  }
}
 
function testCollisionJoueursEnnemis() {
  tonneaux.forEach((el) => {
        if(rectsOverlap(joueur.x, joueur.y, joueur.l, joueur.h,
                 el.x-el.l, el.y-el.h, el.l*2, el.h*2) && !joueur.hit && !joueur.dead && !winner) {
			joueur.life--;
			if (joueur.life > -1) {
				sound.volume = 0.6;
				playSound("hit");
			}
			if(joueur.retry == 1 && joueur.life == 0){
				sound.volume = 0.4;
				playSound("gameover");
				stopMusic();
				if(localStorage.getItem("highScore") < joueur.score){
					localStorage.setItem("highScore",joueur.score);
				}
				gameOver = true;
				timeUpdate = 0;
			}else if(joueur.life == 0){
				sound.volume = 0.9;
				playSound("loselife");
				stopMusic();
				musicisload = false;
				joueur.retry--;
				joueur.endD = joueur.y + joueur.h;
				joueur.dead = true;
				joueur.fall = false;
				joueur.moving = false;
				joueur.jump = false;
				joueur.climb = false;
				joueur.endD = joueur.y - joueur.h;
				timeUpdate = 0;
				joueur.img = images["01D"];
				if (Math.random() < (1 / joueur.retry)) {
					marteau.exist = true;
				}
			}else{
				joueur.hit = true;
			}
		}
	  })
  
  tonneauxBleu.forEach((el) => {
        if(rectsOverlap(joueur.x, joueur.y, joueur.l, joueur.h,
                 el.x-el.l, el.y-el.h, el.l*2, el.h*2) && !joueur.hit && !joueur.dead && !winner) {
			joueur.life--;
			if (joueur.life > -1) {
				sound.volume = 0.6;
				playSound("hit");
			}
			if(joueur.retry == 1 && joueur.life == 0){
				sound.volume = 0.4;
				playSound("gameover");
				stopMusic();
				if(localStorage.getItem("highScore") < joueur.score){
					localStorage.setItem("highScore",joueur.score);
				}
				console.log(localStorage.getItem("highScore"));
				gameOver = true;
			}else if(joueur.life == 0){
				sound.volume = 0.9;
				playSound("loselife");
				joueur.retry--;
				joueur.endD = joueur.y + joueur.h;
				joueur.life = 3;
				joueur.dead = true;
				joueur.fall = false;
				joueur.moving = false;
				joueur.jump = false;
				joueur.climb = false;
				joueur.endD = joueur.y - joueur.h;
				timeUpdate = 0;
				joueur.img = images["01D"];
				if (Math.random() < (1 / joueur.retry)) {
					marteau.exist = true;
				}
			}else{
				joueur.hit = true;
			}
		}
		else if (el.x - el.l > canvas.width || el.y - el.h > canvas.height) {
			tonneauxBleu.splice(tonneauxBleu.indexOf(el),1);
		}
	  })
}
 
function testCollisionTonneauPlatform(){
	tonneaux.forEach((tno)=>{
		tonneaux.onPlatform = false;
		xJ = tno.x;
		yJ = tno.y+tno.h;
		actualLevel.plateform.forEach((plt)=>{
			coef = (plt.y2 - plt.y1) / (plt.x2 - plt.x1);
			tmpy = Math.floor((xJ - plt.x1) * coef + plt.y1 - plt.h / 2);
			if (xJ >= plt.x1 && xJ <= plt.x2) {
				if(yJ >= tmpy + plt.vitesseY && yJ - plt.vitesseY <= tmpy && plt.elevator){
					tno.onPlatform = true;
					tno.y = tmpy - tno.h;
					tno.jump = false;
					tno.fall = false;
					tno.vitesseY = 0;
				}
				else if (yJ >=  tmpy && yJ - tno.vitesseY <= tmpy) {
					tno.onPlatform = true;
					if(tno.fall || (tno.echelle && tno.echlEnd <= tno.y+tno.vitesseY)){
						tno.direction(plt.y1,plt.y2);
						tno.y = tmpy - tno.h;
						tno.fall = false;
						tno.echelle= false;
						tno.passed = false;
						tno.vitesseY = 0;				
					}
				}else if(!tno.echelle && tmpy <= yJ && tmpy > tno.y+(tno.h/4)){
					tno.y = tmpy - tno.h;
					tno.onPlatform = true;
				}
			}else if(!tno.plateform && tno.y + tno.h <= tmpy && tno.y + tno.h/1.3 > tmpy - tno.h && !tno.echelle){
				tno.vitesseY=2;
				tno.fall = true;
			}
			if(!tno.plateform && tmpy > yJ && tmpy-tno.h <= yJ && xJ >= plt.x1 && xJ <= plt.x2 && !tno.echelle){
				tno.vitesseY=1;
				tno.fall = true;
			}
		})
	})
}	
 
function testCollisionJoueursPlatform(){
	xJ = joueur.x+(joueur.l/2);
	yJ = joueur.y+joueur.h;
	joueur.onPlatform = false;
	actualLevel.plateform.forEach((plt)=>{
		coef = (plt.y2 - plt.y1) / (plt.x2 - plt.x1);
		tmpy = Math.floor((xJ - plt.x1) * coef + plt.y1 - plt.h / 2);
		if (xJ >= plt.x1 && xJ <= plt.x2 && !joueur.dead) {
			if(yJ >= tmpy && yJ - plt.vitesseY <= tmpy && plt.elevator){
				joueur.onPlatform = true;
				joueur.y = tmpy - joueur.h;
				joueur.jump = false;
				joueur.fall = false;
				joueur.vitesseY = 0;
				}
			else if (yJ >=  tmpy && yJ - joueur.vitesseY <= tmpy) {
				joueur.onPlatform = true;
				if(joueur.fall){
					joueur.y = tmpy - joueur.h;
					joueur.jump = false;
					joueur.fall = false;
					joueur.vitesseY = 0;
				}
			}else if(!joueur.climb && !joueur.jump && tmpy <= yJ && tmpy > joueur.y+(joueur.h/1.4)){
				joueur.y = tmpy - joueur.h;
				joueur.onPlatform = true;
			}else if(tmpy > yJ && tmpy <= yJ + (joueur.h/1.8) && xJ >= plt.x1 && xJ <= plt.x2 && !joueur.jump && !joueur.climb){
				joueur.y = tmpy - joueur.h;
				joueur.onPlatform = true;
			}
		}else if(!joueur.onPlatform && !joueur.jump && !joueur.climb && !joueur.dead){
            joueur.vitesseY=2;
            joueur.jump = true;
            joueur.fall = true;
        }
	})
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
 
  if ((x1 > (x2 + w2)) || ((x1 + w1) < x2))
     return false; 
  if ((y1 > (y2 + h2)) || ((y1 + h1) < y2))
     return false;
  return true; 
}

function testCollisionTonneauEchelle(tno){
	actualLevel.echelles.forEach((ech) => {
		if ((ech.x <= tno.x && ech.x + ech.l >= tno.x)
			&& (ech.y <= tno.y+tno.l && ech.y + ech.h/2 >= tno.y + tno.l) && !tno.echelle && !tno.passed
		) {
			rand = Math.floor(Math.random() * Math.floor(2));
			if(!tno.passed && rand > 0){
				tno.vitesseX= 0;
				tno.echelle = true;
				tno.echlEnd = ech.y + ech.h/2;
				tno.x = ech.x + tno.l;
				tno.vitesseY= 1;
			}else{
				tno.passed = true;
			}
		}else if((ech.x > tno.x && ech.x + ech.l < tno.x) && (ech.y <= tno.y+tno.l && ech.y + ech.h/2 >= tno.y + tno.l) && !tno.echelle){
			tno.passed = false;
		}
	})
}

function testCollisionJoueurEchelle() {
	ladder = -1;
	endladder = -1;
	xladder = -1;
	actualLevel.echelles.forEach((ech) => {
		if ((ech.x <= joueur.x+joueur.l/2 && ech.x + ech.l >= joueur.x + joueur.l/2) && 
		((ech.y <= joueur.y+joueur.h && ech.y + ech.h >= joueur.y) || (ech.y <= joueur.y + joueur.h && ech.y + ech.h >= joueur.y + joueur.h))) {
			ladder = ech.y;
			endladder = ladder + ech.h;
			xladder = ech.x + ech.l/10;
		}
	})
}

function testCollisionJoueurMarteau() {
	if (marteau.exist && !marteau.get) {
		if (!((joueur.x >= marteau.x + marteau.l) || (joueur.x + joueur.l <= marteau.x) || (joueur.y >= marteau.y + marteau.h) || (joueur.y + joueur.h <= marteau.y))) {
			joueur.marteau = true;
			marteau.get = true;
			playSound("bonus");
		}
	}
}
