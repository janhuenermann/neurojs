var color = require('./color.js');

function distanceSensor(car, opt) {
	this.car = car;
	this.angle = opt.angle / 180 * Math.PI;
	this.length = opt.length || 10;

	this.direction = [ Math.sin(this.angle), Math.cos(this.angle) ]
	this.start = opt.start || [ 0, 0.1 ]

    this.localNormal = p2.vec2.create()
    this.globalRay = p2.vec2.create()

    this.ray = new p2.Ray({
        mode: p2.Ray.CLOSEST,
        direction: this.direction,
        length: this.length,
        checkCollisionResponse: false,
        skipBackfaces: true
    })

    this.updateLength(this.length);

    this.castedResult = new p2.RaycastResult()
    this.hit = false
    this.setDefault()

    this.data = new Float64Array(this.dimensions);
    this.highlighted = false
}

distanceSensor.prototype.dimensions = 3

distanceSensor.prototype.updateLength = function (v) {
	this.length = v
	this.ray.length = this.length
	this.end = [ this.start[0] + this.direction[0] * this.length, this.start[1] + this.direction[1] * this.length ]
	this.rayVector = [ this.end[0] - this.start[0], this.end[1] - this.start[1] ]
};

distanceSensor.prototype.setDefault = function () {
	this.distance = 1.0
	this.entity = 0
	this.localNormal[0] = 0
	this.localNormal[1] = 0
	this.reflectionAngle = 0
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

    if (this.hit = this.castedResult.hasHit()) {
    	this.distance = this.castedResult.fraction
    	this.entity = this.castedResult.shape.entity

    	vehicleBody.vectorToLocalFrame(this.localNormal, this.castedResult.normal)
    	vehicleBody.vectorToWorldFrame(this.globalRay, this.rayVector)

    	this.reflectionAngle = Math.atan2( this.castedResult.normal[1], this.castedResult.normal[0] ) - Math.atan2( this.globalRay[1], this.globalRay[0] ) // = Math.atan2( this.localNormal[1], this.localNormal[0] ) - Math.atan2( this.rayVector[1], this.rayVector[0] )	
    	if (this.reflectionAngle > Math.PI / 2) this.reflectionAngle = Math.PI - this.reflectionAngle
    	if (this.reflectionAngle < -Math.PI / 2) this.reflectionAngle = Math.PI + this.reflectionAngle
    } 

    else {
    	this.setDefault();
    }
};

distanceSensor.prototype.draw = function (g) {
	var dist = this.distance
	var c = color.rgbToHex(Math.floor((1-this.distance) * 255), Math.floor((this.distance) * 128), 128)
	g.lineStyle(this.highlighted ? 0.04 : 0.01, c, 0.5)
	g.moveTo(this.start[0], this.start[1]);
	g.lineTo(this.start[0] + this.direction[0] * this.length * dist, this.start[1] + this.direction[1] * this.length * dist);
};

distanceSensor.prototype.read = function () {
	if (this.hit) {
		this.data[0] = 1.0 - this.distance
		this.data[1] = this.reflectionAngle
		this.data[2] = this.entity === 2 ? 1.0 : 0.0 // is car?
	}

	else {
		this.data.fill(0.0)
	}

	return this.data
};



function speedSensor(car, opt) {
	this.car = car
	this.local = p2.vec2.create()
	this.data = new Float64Array(this.dimensions)
}

speedSensor.prototype.dimensions = 1

speedSensor.prototype.update = function () {
	this.car.chassisBody.vectorToLocalFrame(this.local, this.car.chassisBody.velocity)
	this.velocity = p2.vec2.len(this.car.chassisBody.velocity) * (this.local[1] > 0 ? 1.0 : -1.0)
};

speedSensor.prototype.draw = function (g) {
	if (g.__label === undefined) {
		g.__label = new PIXI.Text('0 km/h', { font: '80px Helvetica Neue' });
		g.__label.scale.x = (g.__label.scale.y = 3e-3);
		g.addChild(g.__label);
	}

	g.__label.text = Math.floor(this.velocity * 3.6) + ' km/h';
	g.__label.rotation = -this.car.chassisBody.interpolatedAngle;
};

speedSensor.prototype.read = function () {
	this.data[0] = this.velocity

	return this.data
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

	if (car.dynamicForwardSensor) {
		config = config.splice(0, 0, { type: 'distance', angle: +0, length: 0 });
	}

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