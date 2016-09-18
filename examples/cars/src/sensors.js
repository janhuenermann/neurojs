var color = require('./color.js');

function distanceSensor(car, opt) {
	this.car = car;
	this.angle = opt.angle / 180 * Math.PI;
	this.length = opt.length || 10;

	this.direction = [ Math.sin(this.angle), Math.cos(this.angle) ];
	this.start = opt.start || [ 0, 0.1 ];
	this.end = [ this.start[0] + this.direction[0] * this.length, this.start[1] + this.direction[1] * this.length ];

    this.localNormal = p2.vec2.create();
    this.ray = new p2.Ray({
        mode: p2.Ray.CLOSEST,
        direction: this.direction,
        length: this.length,
        checkCollisionResponse: false,
        skipBackfaces: true
    });

    this.castedResult = new p2.RaycastResult();
    this.setDefault();
}

distanceSensor.prototype.dimensions = 4

distanceSensor.prototype.setDefault = function () {
	this.normal = [ 0, 0 ]
    this.distance = 1.0
    this.entity = 0
};

distanceSensor.prototype.update = function () {
	var vehicleBody = this.car.chassisBody;
	if (vehicleBody.world === null)
		return ;

    vehicleBody.toWorldFrame(this.ray.from, this.start);
    vehicleBody.toWorldFrame(this.ray.to, this.end);
    
    this.ray.update();
    this.castedResult.reset();

    vehicleBody.world.raycast(this.castedResult, this.ray);

    if (this.castedResult.hasHit()) {
    	this.distance = this.castedResult.fraction
    	vehicleBody.vectorToLocalFrame(this.localNormal, this.castedResult.normal)

    	this.normal[0] = this.localNormal[0]
    	this.normal[1] = this.localNormal[1]

    	this.entity = this.castedResult.shape.entity || 1
    }

    else {
    	this.setDefault();
    }
};

distanceSensor.prototype.draw = function (g) {
	g.lineStyle(0.01, color.rgbToHex(Math.floor((1-this.distance) * 255), Math.floor((this.distance) * 128), 128), 0.5);
	g.moveTo(this.start[0], this.start[1]);
	g.lineTo(this.start[0] + this.direction[0] * this.length * this.distance, this.start[1] + this.direction[1] * this.length * this.distance);
};

distanceSensor.prototype.read = function () {
	return [ 1.0 - this.distance, this.entity ].concat(this.normal)
};



function speedSensor(car, opt) {
	this.car = car;
}

speedSensor.prototype.dimensions = 1

speedSensor.prototype.update = function () {
	this.velocity = p2.vec2.len(this.car.chassisBody.velocity);
};

speedSensor.prototype.draw = function (g) {
	if (g.__label === undefined) {
		g.__label = new PIXI.Text('0 km/h', { font: '80px Helvetica Neue' });
		g.__label.scale.x = (g.__label.scale.y = 3e-3);
		g.addChild(g.__label);
	}

	g.__label.text = Math.floor(this.velocity * 3.6) + ' km/h';
};

speedSensor.prototype.read = function () {
	return [this.velocity];
}


function create(car, opt) {
	switch (opt.type) {
		case 'distance':
			return new distanceSensor(car, opt);

		case 'speed':
			return new speedSensor(car, opt);

		default: 
			return null;
	}
}

function build(car, config) {
	var out = [];

	for (var i = 0; i < config.length; i++) {
		var sensor = create(car, config[i]);
		if (sensor !== null) {
			out.push(sensor);
		}
	}

	return out;
}


module.exports = {
	distance: distanceSensor,
	speed: speedSensor,
	build: build
};