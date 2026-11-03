function mainMenu(){
	ctx.save();
	afficheFond();
	ctx.globalAlpha = 1;
	ctx.drawImage(images["titleDK"], 0, canvas.height/2 -canvas.height/3, canvas.width, canvas.height/3);
	ctx.drawImage(images["RMGD"], canvas.width/1.5, canvas.height/1.5, canvas.width/3, canvas.height/3);
	ctx.drawImage(images["DK"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
	var sizeOfFont = String(canvas.height/18);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle = "white";
	startb += startm * 0.01;
	if (startb <= 0.5 || startb >= 1) {
		startm = -startm;
	}
	ctx.globalAlpha = startb;
	ctx.fillText('Press Spacebar',canvas.width/3,(canvas.height/9));
	afficheHighScore(canvas.width/2,canvas.width/1.15);
	ctx.restore();
}

function startAnimation(){
	ctx.save();
	afficheFond();
	timeUpdate++;
	var mult = 40;
	if(timeUpdate >= canvas.height/2 && timeUpdate <= canvas.height/2 + mult * 9){
		if (!sound_title) {
			playSound("title");
			sound_title = true;
		}
		ctx.drawImage(images["titleDK"], 0, canvas.height/2 -canvas.height/3, canvas.width, canvas.height/3);
		if((timeUpdate <= canvas.height/2 + mult * 5 && timeUpdate >= canvas.height/2 + mult * 2)){
			if (playing) {
				playSound("JCVD");
				playing = false;
			}
			ctx.drawImage(images["RMGD"], canvas.width/1.5, canvas.height/1.5, canvas.width/3, canvas.height/3);
			ctx.drawImage(images["DK"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
		} else if((timeUpdate <= canvas.height/2 + mult * 6 && timeUpdate >= canvas.height/2  + mult * 5) || (timeUpdate <= canvas.height/2 + mult * 8 && timeUpdate >= canvas.height/2 + mult * 7)){
			if (!playing) {
				playSound("sp1");
				playing = true;
			}
			ctx.drawImage(images["RMGD"], canvas.width/1.5, canvas.height/1.5, canvas.width/3, canvas.height/3);
			ctx.drawImage(images["DKG01"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
		}else if((timeUpdate <= canvas.height/2 + mult * 7 && timeUpdate >= canvas.height/2 + mult * 6)||(timeUpdate <= canvas.height/2 + mult * 9 && timeUpdate >= canvas.height/2 + mult * 8)){
			if (playing) {
				playSound("sp1");
				playing = false;
			}
			ctx.drawImage(images["RMGD"], canvas.width/1.5, canvas.height/1.5, canvas.width/3, canvas.height/3);
			ctx.drawImage(images["DKG02"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
		}else{
			ctx.drawImage(images["DK"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
		}
	}else if(timeUpdate >= canvas.height/2 + mult * 9){
		startM = false;
		ctx.drawImage(images["titleDK"], 0, canvas.height/2 -canvas.height/3, canvas.width, canvas.height/3);
		ctx.drawImage(images["RMGD"], canvas.width/1.5, canvas.height/1.5, canvas.width/3, canvas.height/3);
		ctx.drawImage(images["DK"], canvas.width/2 - (canvas.width/7/2), canvas.height/2, canvas.width/7, canvas.height/7);
		timeUpdate = 0;
	}else{
		ctx.drawImage(images["titleDK"], 0, timeUpdate -canvas.height/3, canvas.width, canvas.height/3);
	}
	ctx.restore;
}

function startGame(){
	if(timeUpdate <= 300){
		ctx.save();
		afficheFond();
		var sizeOfFont = String(canvas.height/18);
		ctx.font = sizeOfFont +'px serif';
		ctx.fillStyle='white';
		ctx.fillText('START!',canvas.width/2.4, canvas.height/2);
		timeUpdate++;
		ctx.restore();
	}else{
		joueur.rest();
		timeUpdate = 0;
		dKong.img = images["DK"];
		dKong.atk = false;
		dKong.megAttack = false;
		game = true;
		joueur.life = 3;
		if (!musicisload) {
			var lvlmusic = ((level - 1) % 3) + 1;
			playMusic("music" + lvlmusic);
			musicisload = true;
		}
		if(sessionStorage.getItem("highscore") != null){
			joueur.score =  sessionStorage.getItem("highScore");
		}
		
	}
}