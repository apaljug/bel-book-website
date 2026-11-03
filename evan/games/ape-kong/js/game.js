window.onload = init;

let canvas, ctx;
let game = false;
let ladder = -1;
let endladder = -1;
let xladder = -1;
let emp;
let pnt;
var images ={};
var timeUpdate = 0;
var invulnerability = 0;
var time = 0;
let music = new Audio("");
let sound = new Audio("");
let musicisload = false;
var level = 1;
let tonneaux = [];
let tonneauxBleu = [];
let levelList = [];
let actualLevel;
let dKong;
var startb = 0.74;
var startm = 1;
var gameOver = false;
var winner  = false;
var menu = true;
var startM = true;


function init() {
	canvas = document.querySelector("#myCanvas");
	ctx = canvas.getContext("2d");
	loadAllImage();
	marteau = new Marteau();
	levelList.push(new levelT1());
	levelList.push(new levelT2());
	levelList.push(new levelT3());
	actualLevel = levelList[0];
	actualLevel.initLevel();
	joueur = new player(actualLevel.startx, actualLevel.starty);
	window.onkeydown = traiteKeydown;
	window.onkeyup = traiteKeyup;

	requestAnimationFrame(animation);
}

function animation() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (game) {
		time++;
		if(time == 100){
			time = 0;
		}
	
	dessineEtDeplaceLesObjets();
  
	testeCollisions();
  

	}
	else if(menu && !startM){
		mainMenu();
	}else if(!menu && !startM){
		startGame();
	}else{
		startAnimation();
	}
	requestAnimationFrame(animation);
}


function dessineEtDeplaceLesObjets() {
	afficheFond();
	if(!joueur.dead){
		joueur.draw(ctx);
	}else{
		timeUpdate++;
		joueur.move();
		joueur.draw(ctx);
		actualLevel.bonusList.forEach((bn) =>{
			bn.draw(ctx);
		})
		tonneaux.forEach((tonn) => {
			tonn.draw(ctx);
		})
		tonneauxBleu.forEach((tonb) => {
			tonb.draw(ctx);
		})
		afficheScore();
		afficheLife();
		afficheLevel();
		afficheMarteau();
	}
	afficheBarre();
	actualLevel.plateform.forEach((plt) => {
		plt.draw(ctx);
		plt.move();
	})
	actualLevel.echelles.forEach((ech) => {
		ech.draw(ctx);
    })
	dKong.draw(ctx);
	if(gameOver){
		YouDied();
	}else if(winner){
		DK_death();
		musicisload = false;
		if (!musicisload) {
			var lvlmusic = ((level - 1) % 3) + 1;
			playMusic("music" + lvlmusic);
			musicisload = true;
	}
	}else if (!joueur.dead){
		dKong.donkeyAttack();
		afficheScore();
		afficheLife();
		afficheLevel();
		afficheMarteau();
		if(joueur.moving){
			timeUpdate++;
		}
		if (joueur.jump) {
			AnimJump();
		}
		actualLevel.bonusList.forEach((bn) =>{
			bn.draw(ctx);
		})
		
		tonneaux.forEach((tonn) => {
			tonn.draw(ctx);
			tonn.move();

		})
		
		tonneauxBleu.forEach((tonb) => {
			tonb.draw(ctx);
			tonb.move();

		})
		marteau.draw(ctx);
		joueur.move();
		marioAtDK();
	} 
	if(joueur.dead){
			circle();
	}	

}



