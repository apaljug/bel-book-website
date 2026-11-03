function traiteKeydown(evt) {
	let code = evt.code;
	if (game && !joueur.dead) {
		if (evt.keyCode == 32) {
			useHammer();
		}
		switch(code) {
			case 'ArrowRight':
				if (joueur.climb) {
					if (joueur.y +joueur.h <= ladder) {
						joueur.climb = false;
					}
				}
				if (!joueur.climb) {
					joueur.moving = true;
					joueur.vitesseX = joueur.vitesseMax;
				}
				break;
			case 'ArrowLeft':
				if (joueur.climb) {
					if (joueur.y +joueur.h <= ladder) {
						joueur.climb = false;
					}
				}
				if (!joueur.climb) {
					joueur.moving = true;
					joueur.vitesseX = -joueur.vitesseMax;
				}
				break;
			case 'ArrowUp':
				AnimClimb(true);
				if (!joueur.jump  && !joueur.climb) {
					joueur.jump = true;
					joueur.climb = false;
					emp = joueur.y - (joueur.h*1.5);
					joueur.vitesseY = -2;
				}
	 
				break;
			case 'ArrowDown':
				AnimClimb(false);
				break;
			}
		}
		else {
			if (evt.keyCode == 32 && menu && !startM) {
				menu = false;
				timeUpdate = 0;
				playSound("start");
				requestAnimationFrame(animation);
			}else if(evt.keyCode == 32 && menu && startM){
				startM = false;
			}
		}
}
 
function traiteKeyup(evt) {
	let code = evt.code;
		switch(code) {
			case 'ArrowRight':
				joueur.stop();
			case 'ArrowLeft':
				if(joueur.vitesseX > 0 && !joueur.climb && !joueur.dead){
					joueur.img = images["01R"];
				}else if(!joueur.climb && !joueur.dead){
					joueur.img = images["01L"];
				}
				joueur.vitesseX = 0;
				joueur.stop();
				break;
			case 'ArrowUp':
				joueur.stop();
				if(joueur.climb){
					if (joueur.y + joueur.h <= ladder) {
						joueur.climb = false;
					}
					joueur.vitesseY = 0;
				}
			case 'ArrowDown':
				joueur.stop();
				if(joueur.climb){
					if (joueur.y + joueur.h >= endladder) {
						joueur.climb = false;
					}
					joueur.vitesseY = 0;
				}
			}
}
  