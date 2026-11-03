class donkeyKong{
	constructor(x){
		this.x = x;
		this.y = canvas.height/9;
		this.h = canvas.height/10;
		this.l = canvas.width/10;
		this.img = images["DK"];
		this.wait = 0;
		this.atk = false;
		this.megAttack = false;
		this.fall = false;
		this.DKJump;
		this.easy = 3;
	}
	
	draw(ctx){
		ctx.save();
		ctx.drawImage(this.img,this.x,this.y,this.l,this.h); 
		ctx.restore();
	}	

	donkeyAttack(){
		if(Math.floor(level/3) < this.easy){
			var num = this.easy-Math.floor(level/3);	
		}else{
			var num = 0;
		}
		if(this.atk){
			if(this.wait == 80){
				tonneaux.push(new Tonneau(this.x + (this.l/2),this.y + (this.h/1.5),0));
				this.img = images["DK"];
				this.wait = 0;
				this.atk = false;
			}else if(this.wait <= 40){
				this.img = images["DKA2"];
				this.wait ++;
			}else{
				this.img = images["DKA"];
				this.wait ++;
			}
			
		} else if (this.megAttack) {
			if (this.wait == 0 || this.wait == 120) {
				this.img = images["DKSPL1"];
				playSound("sp1");
				this.wait ++;
			}
			else if (this.wait == 60 || this.wait == 180) {
				this.img = images["DKSPR1"];
				playSound("sp1");
				this.wait ++;
			}
			else if (this.wait == 240) {
				this.img = images["DKSP2"];
				this.wait ++;
			}
			else if (this.wait == 300) {
				
				if ((((level - 1) % 3) + 1) == 2) {
					this.img = images["DK"];
					tonneauxBleu.push(new TonneauBleu(0,2, canvas.width/2));
					tonneauxBleu.push(new TonneauBleu(-0.8,1.2, canvas.width/2));
					tonneauxBleu.push(new TonneauBleu(-0.4,1.6, canvas.width/2));
					tonneauxBleu.push(new TonneauBleu(0.8,1.2, canvas.width/2));
					tonneauxBleu.push(new TonneauBleu(0.4,1.6, canvas.width/2));
				}
				else {
					this.img = images["DKSP3"];
					tonneauxBleu.push(new TonneauBleu(2,0));
					tonneauxBleu.push(new TonneauBleu(1.6,0.4));
					tonneauxBleu.push(new TonneauBleu(1.2,0.8));
					tonneauxBleu.push(new TonneauBleu(0.8,1.2));
					tonneauxBleu.push(new TonneauBleu(0.4,1.6));
					tonneauxBleu.push(new TonneauBleu(0,2));
				}
				this.wait ++;
			}
			else if (this.wait == 360) {
				this.img = images["DK"];
				this.megAttack = false;
				this.wait = 0;
			}
			else {
				this.wait ++;
			}
		}else if(Math.floor(Math.random() * Math.floor(3 + num)) == 0 && !this.megAttack && time == 0){
			this.atk = true;
		}else if(Math.floor(Math.random() * Math.floor(4 + num)) == 0 && !this.atk && time == 0 && level > 3){
			this.megAttack = true;
		}
	}
	
}

function DK_death(){
	ctx.save();
	if (dKong.y > dKong.DKjump && !dKong.fall) {
		dKong.y -= 0.4;
		dKong.img = images["DK_die"];
		if (dKong.y <= dKong.DKjump) {
			dKong.fall = true;
		}
	}
	else if ((dKong.y - 2 * dKong.h) < canvas.height) {
		dKong.y += 2;
	}
	else {
		dKong.img = images["DK"];
		afficheWin();
		afficheScore();
		afficheLife();
		afficheLevel();
	}
	ctx.restore;
}

function marioAtDK(){
	if(!joueur.dead && joueur.y + joueur.h <= dKong.y+dKong.h && joueur.x + joueur.l <= dKong.x+dKong.l && joueur.x >= 0 && !winner){
		winner = true;
		dKong.DKjump = dKong.y - dKong.h / 4;
		pnt = joueur.score;
		marteau = new Marteau();
		joueur.marteau = false;
		stopMusic();
		playSound("onDK");
	}
}