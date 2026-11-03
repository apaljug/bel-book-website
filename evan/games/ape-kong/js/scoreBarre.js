function afficheBarre(){
		ctx.save();
		var lineaire = ctx.createLinearGradient(0,0,canvas.width,0);
		lineaire.addColorStop(0,"green");
		lineaire.addColorStop(0.5,"blue");
		lineaire.addColorStop(1,"red");
		ctx.strokeStyle = lineaire;
		ctx.strokeRect(0, 0, canvas.width, canvas.height/10);	
		ctx.restore();
}

function afficheScore(){
	var sizeOfFont = String(canvas.height/18);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle='white';
	ctx.fillText('SCORE',0, canvas.height/25);
	ctx.fillStyle='white';
	if(joueur.score != 0){
		cond = 5 - (Math.log10(joueur.score));
	}else{
		cond = 5;
	}
	for(i = 0; i < cond;i++){
		ctx.fillText("0",0+(canvas.width/35 * i),canvas.height/11);
	}
	ctx.fillText(joueur.score,(canvas.width/35 * i),canvas.height/11);
	afficheHighScore(canvas.width/3.26,canvas.height/25);
}

function afficheLife(){
	ctx.save();
	for(i = 0;i<joueur.life;i++){
		ctx.drawImage(images["life"],(canvas.width/1.6) + (canvas.width/15*i)
		,canvas.height/50,canvas.width/20,canvas.height/18);
	}
	ctx.drawImage(images["01R"],canvas.width-(canvas.width/15)
		,canvas.height/50,canvas.width/20,canvas.height/18);
	var sizeOfFont = String(canvas.height/18);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle='white';
    ctx.fillText('x',canvas.width - (canvas.height/7.4), canvas.height/15);
	ctx.fillText(joueur.retry,canvas.width - (canvas.height/10),canvas.height/15);
	ctx.restore();
}

function afficheLevel(){
	var sizeOfFont = String(canvas.height/18);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle='white';
    ctx.fillText('LVL',canvas.width/2.3, canvas.height/25);
	ctx.fillText(level,(canvas.width/2.13),canvas.height/11);
}

function afficheMarteau() {
	var img = images["bonus"];
	if (joueur.marteau) {
		ctx.drawImage(img, 56 * (canvas.width / 100), canvas.height/50, (canvas.width/20), (canvas.height/17));
	}
}

function resetLevel(){
	time = 0;
	winner = false;
	dKong.fall = false;
	musicisload = false;
	levelList.splice(0,1);
	if((level-1)%3 == 0){
		levelList.push(new levelT1());
	}else if((level-1)%3 == 1){
		levelList.push(new levelT2());
	}else{
		levelList.push(new levelT3());
	}
	level++;
	actualLevel = levelList[0];
	if((level-1)%3 == 0 && level > 1){
		joueur.retry++;
	}
	actualLevel.initLevel();
	joueur.rest();
	if(localStorage.getItem("highScore") < joueur.score){
		localStorage.setItem("highScore",joueur.score);
	}
	tonneaux = [];
	tonneauxBleu = [];
}

function afficheWin(){
	if(joueur.score < pnt +500){
	joueur.score += 2;
	}else if (joueur.score == pnt +500){
			resetLevel();
	}
}

function YouDied(){
	ctx.save();
	timeUpdate++;
	if(timeUpdate <= 800){
		if(timeUpdate <= 100){
			ctx.globalAlpha = timeUpdate/100;
		}
		var fontup=canvas.height/18 + timeUpdate/20;
	}else{
		ctx.globalAlpha = 1;
		var fontup = canvas.height/18 + 800/20;
	}
	if(timeUpdate/100 <= 0.8){
		ctx.globalAlpha = timeUpdate/100;
	}else{
		ctx.globalAlpha = 0.8;
	}
	afficheFond();
	var sizeOfFont = String(fontup);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle = "red";		
	ctx.fillText('YOU DIED',canvas.width/2 - (fontup) * 4.75/2,(canvas.height/2 + (fontup/2)));
	ctx.globalAlpha = 1;
	ctx.restore();
	if(timeUpdate >= 900){
		 window.location.reload(1);
	}
}

function afficheHighScore(x,y){
	var sizeOfFont = String(canvas.height/18);
	ctx.font = sizeOfFont +'px serif';
	ctx.fillStyle='red';
	ctx.fillText("HiSCORE", x - (canvas.width/30 * 3.5),y);
	if(localStorage.getItem("highScore") != null && localStorage.getItem("highScore") != 0){
		cond = 5 - (Math.log10(localStorage.getItem("highScore")));
	}else{
		cond = 6;
	}
	for(i = 0; i < cond;i++){
		ctx.fillText("0",x - (canvas.width/30 * 2.4) +(canvas.width/35 * i),y + canvas.height/19.5);
	}
	if(localStorage.getItem("highScore") != null){
		ctx.fillText(localStorage.getItem("highScore"),x - (canvas.width/30 * 2.4) + (canvas.width/35 * i),y + canvas.height/19.5);
	}
}

