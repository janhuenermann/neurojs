var color = require('./color.js');
var car = require('./car.js')
// var p2 = require('p2')

class Sensor {}

class DistanceSensor extends Sensor {

    constructor(car, opt) {
        super()
        this.type = "distance"
        this.car = car
        this.angle = opt.angle / 180 * Math.PI
        this.length = opt.length || 10
        this.absolute = opt.absolute || false

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

        this.setLength(this.length);

        this.castedResult = new p2.RaycastResult()
        this.hit = false
        this.distance = 0.0
        this.entity = 'none'

        this.data = new Float64Array(DistanceSensor.dimensions)
    }

    setLength(v) {
        this.length = v
        this.ray.length = this.length
        this.end = [ this.start[0] + this.direction[0] * this.length, this.start[1] + this.direction[1] * this.length ]
        this.rayVector = [ this.end[0] - this.start[0], this.end[1] - this.start[1] ]
    }

    update() {
        var vehicleBody = this.car.chassisBody;
        if (vehicleBody.world === null) return;

        vehicleBody.toWorldFrame(this.ray.from, this.start);
        vehicleBody.toWorldFrame(this.ray.to, this.end);

        this.ray.update();
        this.castedResult.reset();

        vehicleBody.world.raycast(this.castedResult, this.ray);

        if (this.hit = this.castedResult.hasHit()) {
            this.distance = this.castedResult.fraction;
            this.entity = this.castedResult.body.entity || 'none';

            vehicleBody.vectorToLocalFrame(this.localNormal, this.castedResult.normal);
            vehicleBody.vectorToWorldFrame(this.globalRay, this.rayVector);

            this.reflectionAngle = Math.atan2(this.castedResult.normal[1], this.castedResult.normal[0]) - Math.atan2(this.globalRay[1], this.globalRay[0]); // = Math.atan2( this.localNormal[1], this.localNormal[0] ) - Math.atan2( this.rayVector[1], this.rayVector[0] ) 
            if (this.reflectionAngle > Math.PI / 2) this.reflectionAngle = Math.PI - this.reflectionAngle;
            if (this.reflectionAngle < -Math.PI / 2) this.reflectionAngle = Math.PI + this.reflectionAngle;
        } else {
            this.distance = 1.0;
            this.entity = 'none';
            this.localNormal[0] = 0;
            this.localNormal[1] = 0;
            this.reflectionAngle = 0;
        }

        if (this.hit) {
            this.data[0] = 1.0 - this.distance;
            this.data[1] = this.reflectionAngle;
            this.data[2] = this.entity === 'car' ? 1.0 : 0.0; // is car?
        } else {
            this.data.fill(0.0);
        }
    }

    draw(g) {
        var dist = this.hit ? this.distance : 1.0
        var c = color.rgbToHex(Math.floor((1-dist) * 255), Math.floor((dist) * 128), 128)
        g.lineStyle(this.highlighted ? 0.04 : 0.01, c, 0.5)
        g.moveTo(this.start[0], this.start[1]);
        g.lineTo(this.start[0] + this.direction[0] * this.length * dist, this.start[1] + this.direction[1] * this.length * dist);
    }

}

class SpeedSensor extends Sensor {

    constructor(car, opt) {
        super()
        this.type = "speed"
        this.car = car
        this.local = p2.vec2.create()
        this.data = new Float64Array(SpeedSensor.dimensions)
    }

    update() {
        this.car.chassisBody.vectorToLocalFrame(this.local, this.car.chassisBody.velocity)
        this.data[0] = this.velocity = p2.vec2.len(this.car.chassisBody.velocity) * (this.local[1] > 0 ? 1.0 : -1.0)
        // this.data[1] = this.local[1]
        // this.data[2] = this.local[0]
    }

    draw(g) {
        if (g.__label === undefined) {
            g.__label = new PIXI.Text('0 km/h', { font: '80px Helvetica Neue' });
            g.__label.scale.x = (g.__label.scale.y = 3e-3);
            g.addChild(g.__label);
        }

        g.__label.text = Math.floor(this.velocity * 3.6) + ' km/h';
        g.__label.rotation = -this.car.chassisBody.interpolatedAngle;
    }

}

class PositionSensor extends Sensor {

    constructor(car, opt) {
        super()
        this.type = "position"
        this.car = car
        this.data = new Float64Array(PositionSensor.dimensions)
    }

    update() {
        this.data[0] = this.car.chassisBody.position[0]
        this.data[1] = this.car.chassisBody.position[1]
        this.data[2] = Math.sin(this.car.chassisBody.angle)
        this.data[3] = Math.cos(this.car.chassisBody.angle)
    }

    draw(g) { }

}

class ContactSensor extends Sensor {

    constructor(car, opt) {
        super()
        this.type = "contact"
        this.car = car
        this.data = new Float64Array(ContactSensor.dimensions)
    }

    update() {
        this.data[0] = this.car.hasContact('obstacle') ? 1 : 0
        this.data[1] = this.car.hasContact('car') ? 1 : 0
    }

    draw(g) { }

}

class TargetSensor extends Sensor {

    constructor(car, opt) {
        super()
        this.type = "target"
        this.car = car
        this.car.target = new Float64Array(2)
        this.data = new Float64Array(TargetSensor.dimensions)
    }

    update() {
        this.data[0] = this.car.target[0]
        this.data[1] = this.car.target[1]

        var dx = this.car.target[0] - this.car.chassisBody.position[0]
        var dy = this.car.target[1] - this.car.chassisBody.position[1]
        this.data[2] = Math.sqrt(dx * dx + dy * dy)
    }

    draw(g) {
        if (g.__subgraphic === undefined) {
            g.__subgraphic = new PIXI.Graphics();
            g.parent.parent.addChild(g.__subgraphic);
        }

        g.__subgraphic.beginFill(this.car.chassisBody.color);
        g.__subgraphic.drawCircle(0, 0, 0.3);

        // var p =  p2.vec2.create()
        // this.car.chassisBody.toLocalFrame(p, this.car.target);

        g.__subgraphic.x = this.car.target[0]
        g.__subgraphic.y = this.car.target[1]

    }

}

const sensorTypes = {
    "distance": DistanceSensor,
    "speed": SpeedSensor,
    "position": PositionSensor,
    "target": TargetSensor,
    "contact": ContactSensor
}

DistanceSensor.dimensions = 3
SpeedSensor.dimensions = 1
PositionSensor.dimensions = 4
ContactSensor.dimensions = 2
TargetSensor.dimensions = 3

class SensorArray {

    constructor(car, blueprint) {
        this.sensors = []
        this.dimensions = blueprint.dimensions
        this.data = new Float64Array(blueprint.dimensions)

        for (var i = 0; i < blueprint.list.length; i++) {
            var opt = blueprint.list[i]
            this.sensors.push(new sensorTypes[opt.type](car, opt))
        }
    }

    update() {
        for (var i = 0, k = 0; i < this.sensors.length; k += this.sensors[i].data.length, i++) {
            this.sensors[i].update()
            this.data.set(this.sensors[i].data, k)
        }
    }

    draw(g) {
        for (var i = 0; i < this.sensors.length; i++) {
            this.sensors[i].draw(g)
        }
    }

    getByType(type) {
        for (var i = 0, found = []; i < this.sensors.length; i++) {
            if (this.sensors[i].type === type) {
                found.push(this.sensors[i])
            }
        }
        return found
    }

}



class SensorBlueprint {

    constructor(list) {
        this.list = list
        this.dimensions = 0

        for (var i = 0; i < this.list.length; i++) {
            var opt = this.list[i]
            this.dimensions += sensorTypes[opt.type].dimensions
        }
    }

    build(car) {
        return new SensorArray(car, this)
    }


    static compile(list) {
        return new SensorBlueprint(list)
    }

}



module.exports = {
    SensorArray, SensorBlueprint
};