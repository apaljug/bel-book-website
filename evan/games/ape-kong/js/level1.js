class levelT1 {
	constructor(){
		this.plateform = [];
		this.echelles = [];
		this.bonusList = [];
		this.color = 'red';
		this.starty = canvas.height/1.1;
		this.startx = canvas.width/10;
	}
	
	initLevel(){
		this.plateform.splice(0,this.plateform.length);
		tonneaux.splice(0,this.plateform.length);
		this.echelles.splice(0,this.plateform.length);
		dKong = new donkeyKong(canvas.width/25);
		this.loadPlateform();
		this.loadEchelle();
		this.loadBonus();
	}

	loadPlateform(){
		this.plateform.push(new Plateform(0,canvas.width/4.55,
		canvas.width-(canvas.width/10),canvas.width/4.55,this.color));
		this.plateform.push(new Plateform(0, canvas.height-canvas.height/120, 
		canvas.height, canvas.height - canvas.height/7.8*0.4,this.color));
		this.plateform.push(new Plateform(0, canvas.height - (canvas.height/7.8*1.5),
		canvas.width-(canvas.width/10), canvas.height - canvas.height/7.8,this.color));
		this.plateform.push(new Plateform(canvas.width/10, canvas.height - (canvas.height/7.8*2.1),
		canvas.width, canvas.height - (canvas.height/7.8*2.8),this.color));
		this.plateform.push(new Plateform(0, canvas.height - (canvas.height/7.8*4), 
		canvas.width-(canvas.width/10),  canvas.height - (canvas.height/7.8*3.4),this.color));
		this.plateform.push(new Plateform(canvas.width/10,canvas.height - (canvas.height/7.8*4.6),
		canvas.width,  canvas.height - (canvas.height/7.8*5.5),this.color));
	}

	loadEchelle(){
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.5,canvas.height-(canvas.height/5.6),canvas.width/6.8));
		this.echelles.push(new Echelle(canvas.width-canvas.width/3,canvas.height-(canvas.height/6.4),canvas.width/8.8));
		this.echelles.push(new Echelle(canvas.width-canvas.width/2,canvas.height-(canvas.height/2.09),canvas.width/6.2));
		this.echelles.push(new Echelle(canvas.width-canvas.width/1.5,canvas.height-(canvas.height/1.57),canvas.width/6.7));
		this.echelles.push(new Echelle(canvas.width-canvas.width/3,canvas.height-(canvas.height/1.47),canvas.width/4.5));
		this.echelles.push(new Echelle(canvas.width-canvas.width/2,canvas.height-(canvas.height/1.26),canvas.width/6.8));
	}

	loadBonus(){
		this.bonusList.push(new bonus(canvas.width/1.4,canvas.height/1.4));
		this.bonusList.push(new bonus(canvas.width/15,canvas.height/1.8));
		this.bonusList.push(new bonus(canvas.width/1.8,canvas.height/1.7));
		this.bonusList.push(new bonus(canvas.width/5,canvas.height/2.5));
		this.bonusList.push(new bonus(canvas.width - canvas.width/10,canvas.height/10));
	}
}