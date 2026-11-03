class levelT2 {
	constructor(){
		this.plateform = [];
		this.echelles = [];
		this.bonusList = [];
		this.color = 'blue';
		this.starty = canvas.height/1.1;
		this.startx = canvas.width/5;
	}
	
	initLevel(){
		this.plateform.splice(0,this.plateform.length);
		tonneaux.splice(0,this.plateform.length);
		this.echelles.splice(0,this.plateform.length);
		dKong = new donkeyKong(canvas.width/2-(canvas.width/10/2));
		this.loadPlateform();
		this.loadEchelle();
		this.loadBonus();
	}

	loadPlateform(){
		this.plateform.push(new Plateform(canvas.width/3,canvas.width/4.55,canvas.width-(canvas.width/3),canvas.width/4.55,this.color));
		this.plateform.push(new Plateform(0, canvas.height-canvas.height/120, canvas.height, canvas.height-canvas.height/120,this.color));
		this.plateform.push(new Plateform(canvas.width-canvas.width/1.05, canvas.height - (canvas.height/7.8*1.5), canvas.width/1.05, canvas.height - (canvas.height/7.8*1.5),this.color));
		this.plateform.push(new Plateform(canvas.width/7, canvas.height - (canvas.height/7.8*2.8), canvas.width-(canvas.width/7), canvas.height - (canvas.height/7.8*2.8),this.color));
		this.plateform.push(new Plateform(canvas.width/5, canvas.height - (canvas.height/7.8*4), canvas.width-(canvas.width/5),  canvas.height - (canvas.height/7.8*4),this.color));
		this.plateform.push(new Plateform(canvas.width/4, canvas.height - (canvas.height/7.8*5.1),  canvas.width-(canvas.width/4),  canvas.height - (canvas.height/7.8*5.1),this.color));
	}

	loadEchelle(){
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.08,canvas.height-(canvas.height/4.9),canvas.width/5.35));
		this.echelles.push(new Echelle(canvas.width/1.08-(canvas.width/19),canvas.height-(canvas.height/4.9),canvas.width/5.35));
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.5,canvas.height-(canvas.height/4.9),canvas.width/5.35));
		this.echelles.push(new Echelle(canvas.width/1.5-(canvas.width/19),canvas.height-(canvas.height/4.9),canvas.width/5.35));
		this.echelles.push(new Echelle(canvas.width/1.32,canvas.height-(canvas.height/2.7),canvas.width/5.8));
		this.echelles.push(new Echelle(canvas.width-canvas.width/2-(canvas.width/19)/2,canvas.height-(canvas.height/2.7),canvas.width/5.8));
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.32-(canvas.width/19),canvas.height-(canvas.height/2.7),canvas.width/5.8));
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.5,canvas.height-(canvas.height/1.9),canvas.width/6.2));
		this.echelles.push(new Echelle(canvas.width/1.5-(canvas.width/19),canvas.height-(canvas.height/1.9),canvas.width/6.2));
		this.echelles.push(new Echelle(canvas.width-canvas.width/2-(canvas.width/19)/2,canvas.height-(canvas.height/1.5),canvas.width/6.9));
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.6,canvas.height-(canvas.height/1.26),canvas.width/7.5));
		this.echelles.push(new Echelle(canvas.width/1.6-(canvas.width/19),canvas.height-(canvas.height/1.26),canvas.width/7.5));
	}

	loadBonus(){
		this.bonusList.push(new bonus(canvas.width/1.1,canvas.height/1.6));
		this.bonusList.push(new bonus(canvas.width-canvas.width/1.1-(canvas.width/18)/2*2,canvas.height/1.6));
		this.bonusList.push(new bonus(canvas.width/2-(canvas.width/18)/2,canvas.height/1.9));
		this.bonusList.push(new bonus(canvas.width/10,canvas.height/2.5));
		this.bonusList.push(new bonus(canvas.width - canvas.width/10-(canvas.width/18)/2*2,canvas.height/2.5));
		this.bonusList.push(new bonus(canvas.width/2-(canvas.width/18)/2,canvas.height/4));
	}
}
