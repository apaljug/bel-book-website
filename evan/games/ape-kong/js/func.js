var playing = true;
var sound_title = false;

function loadImage(name) {

  images[name] = new Image();
  images[name].onload = function() { 
  }
  images[name].src = "image/" + name + ".png";
}

function loadAllImage(){
	  
  loadImage("01C");
  loadImage("01L");
  loadImage("01R");
  loadImage("02C");
  loadImage("02L");
  loadImage("02R");
  loadImage("coins01");
  loadImage("coins02");
  loadImage("DK");
  loadImage("DKA");
  loadImage("DKA2");
  loadImage("DKG01");
  loadImage("DKG02");
  loadImage("JL");
  loadImage("JR");
  loadImage("ladder");
  loadImage("life");
  loadImage("T01");
  loadImage("T02");
  loadImage("T03");
  loadImage("T04");
  loadImage("TF01");
  loadImage("TF02");
  loadImage("bonus");
  loadImage("01D");
  loadImage("DKSPL1");
  loadImage("DKSPR1");
  loadImage("DKSP2");
  loadImage("DKSP3");
  loadImage("TB1");
  loadImage("TB2");
  loadImage("TB3");
  loadImage("TB4");
  loadImage("titleDK");
  loadImage("Dcircle");
  loadImage("DK_die");
  loadImage("RMGD");
}

function afficheFond(){
	ctx.save();
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
}

function playMusic(name) {
	music.src = "sound/"+ name +".mp3";
	if (music.paused = true) {
		music.volume = 0.6;
		music.play();
		music.loop = true;
	}
}

function stopMusic() {
	music.pause();
}

function playSound(name) {
	sound.src = "sound/"+ name +".mp3";
	if (sound.paused = true) {
		sound.play();
		sound.loop = false;
	}
}

function useHammer() {
	if (joueur.marteau) {
		xJ = joueur.x+(joueur.l/2);
		yJ = joueur.y+joueur.h;
		actualLevel.plateform.forEach((plt)=>{
			coef = (plt.y2 - plt.y1) / (plt.x2 - plt.x1);
			tmpy = Math.floor((xJ - plt.x1) * coef + plt.y1 - plt.h / 2);
			if (xJ >= plt.x1 && xJ <= plt.x2) {
				if (yJ >=  tmpy && yJ - joueur.vitesseY <= tmpy) {
					joueur.marteau = false;
					playSound("hammer");
					
					tonneaux.forEach((tno)=>{
						xT = tno.x - tno.h/2;
						if (xT >= plt.x1 && xT <= plt.x2) {
							yT = tno.y + tno.h;
							tmpy2 = plt.y1 + xT * coef;
							if (yT + tno.h >=  tmpy2 && yT - tno.h <=  tmpy2) {
								tonneaux.splice(tonneaux.indexOf(tno),1);
							}
						}
					})
				}
			}
		})
	}
}