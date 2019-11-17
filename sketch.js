var width, height, center;
var smooth = true;


var mousePos = view.center / 2;
var pathHeight = mousePos.y;

var mouseInteract = 1;
var audio = new Audio('ahhh.mp3');
var audioD;
var volume1 = 1;

//background color

 var rect = new Path.Rectangle({
    point: [0, 0],
    size: [view.size.width, view.size.height],
});
rect.sendToBack();
rect.fillColor = 'white';

// ball -------------
function Ball(r, p, v) {
	this.radius = r;
	this.point = p;
	this.vector = v;
	this.maxVec = 15;
	this.numSegment = Math.floor(r / 3 + 2);
	this.boundOffset = [];
	this.boundOffsetBuff = [];
	this.sidePoints = [];
	this.hit = false;
	this.time = 0;
	this.path = new Path({
		fillColor: {
			 gradient: {
            stops: ['yellow', 'red', 'blue']
       		 },
        	origin: (0,0),
        	destination: (1600,800)
		},
		// blendMode: 'lighter'
	});

	this.img = new Raster('normal');
	this.img.position = this.point;
	this.img.scale(r/120-0.15);
	this.rotation = 0;
	this.img.rotate(this.rotation);
	this.img.visible = true;

	this.img2 = new Raster('scream');
	this.img2.position = this.point;
	this.img2.scale(r/120-0.2);
	this.rotation2 = 0;
	this.img2.rotate(this.rotation2);
	this.img2.visible = false;

	this.imgTime = 0;

	for (var i = 0; i < this.numSegment; i ++) {
		this.boundOffset.push(this.radius);
		this.boundOffsetBuff.push(this.radius);
		this.path.add(new Point());
		this.sidePoints.push(new Point({
			angle: 360 / this.numSegment * i,
			length: 1
		}));
	}
}

Ball.prototype = {
	iterate: function() {

		this.checkBorders();
		if (this.vector.length > this.maxVec)
			this.vector.length = this.maxVec;
		this.point += this.vector;

		this.img.position = this.point;
		this.rotation = this.vector.length/2;
		this.img.rotate(this.rotation);

		this.img2.position = this.point;
		this.rotation2 = this.vector.length/2;
		this.img2.rotate(this.rotation2);

		this.updateShape();

		// if (this.hit){
		// 	audio.play();
		// 	this.hit = !this.hit;
		// }
	},

	checkBorders: function() {
		var size = view.size;
		if (this.point.x < -this.radius)
			this.point.x = size.width + this.radius;
		if (this.point.x > size.width + this.radius)
			this.point.x = -this.radius;
		if (this.point.y < -this.radius)
			this.point.y = size.height + this.radius;
		if (this.point.y > size.height + this.radius)
			this.point.y = -this.radius;
	},

	updateShape: function() {
		var segments = this.path.segments;
		for (var i = 0; i < this.numSegment; i ++)
			segments[i].point = this.getSidePoint(i);

		this.path.smooth();
		for (var i = 0; i < this.numSegment; i ++) {
			if (this.boundOffset[i] < this.radius / 4)
				this.boundOffset[i] = this.radius / 4;
			var next = (i + 1) % this.numSegment;
			var prev = (i > 0) ? i - 1 : this.numSegment - 1;
			var offset = this.boundOffset[i];
			offset += (this.radius - offset) / 30; // original 15
			offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
			this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
		}
	},

	react: function(b) {
		var dist = this.point.getDistance(b.point);
		if (dist < this.radius + b.radius && dist != 0) {
			this.imgTime = 60;
			if(this.time == 0) {// previous hit = false
				var volume1 = (1-dist/(this.radius+b.radius))*0.4+0.6;//[0,1]
			// var playbackRate1 = Math.floor(volume1*400+100)*0.01; //[1,5]
			
			// audio.playbackRate = playbackRate1;
				this.time = 18;
			// audio.play()
				var audioD = audio.cloneNode(true); // need delay 
				audioD.volume = volume1;
				audioD.play();
			}

			this.time -=1;
			var overlap = this.radius + b.radius - dist;
			var direc = (this.point - b.point).normalize(overlap * 0.01); // original 0.015
			this.vector += direc;
			b.vector -= direc;

			this.calcBounds(b);
			b.calcBounds(this);
			this.updateBounds();
			b.updateBounds();

			if(this.time <= 0){
				this.time = 0;
			}


		}

		if(this.imgTime > 0){
			this.img2.visible = true;
			this.img.visible = false;
			b.img2.visible = true;
			b.img.visible = false;
			this.imgTime -= 1;
		}else{
			this.imgTime = 0;
			this.img.visible = true;
			this.img2.visible = false;
			b.img.visible = true;
			b.img2.visible = false;
		}



	},


	


	getBoundOffset: function(b) {
		var diff = this.point - b;
		var angle = (diff.angle + 180) % 360;
		return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
	},

	calcBounds: function(b) {
		for (var i = 0; i < this.numSegment; i ++) {
			var tp = this.getSidePoint(i);
			var bLen = b.getBoundOffset(tp);
			var td = tp.getDistance(b.point);
			if (td < bLen) {
				this.boundOffsetBuff[i] -= (bLen  - td) / 2;
			}
		}
	},

	getSidePoint: function(index) {
		return this.point + this.sidePoints[index] * this.boundOffset[index];
	},

	updateBounds: function() {
		for (var i = 0; i < this.numSegment; i ++)
			this.boundOffset[i] = this.boundOffsetBuff[i];
	}
};

var balls = [];
var numBalls = 3;
for (var i = 0; i < numBalls; i++) {
	var position = Point.random() * view.size;
	var vector = new Point({
		angle: 360 * Math.random(),
		length: Math.random() * 10
	});
	var radius = Math.random() * 60 + 60;
	balls.push(new Ball(radius, position, vector));
}


function onFrame(event) {
	for (var i = 0; i < balls.length - 1; i++) {
		for (var j = i + 1; j < balls.length; j++) {
			balls[i].react(balls[j]);
		}
	}
	for (var i = 0, l = balls.length; i < l; i++) {
		balls[i].iterate();
	}

}

function onMouseMove(event) {
	mousePos = event.point;
	
}


function onMouseDown(event){
	console.log("add");
	var position = event.point;
	var vector = new Point({
		angle: 360 * Math.random(),
		length: Math.random() * 10
	});
	var radius = Math.random() * 60 + 60;
	balls.push(new Ball(radius, position, vector));
}



