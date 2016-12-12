var color = require('./color.js'),
    sensors = require('./sensors.js'),
    tc = require('./tiny-color.js');

function car(world, opt) {
    this.options = {
        sensors: [

            { type: 'distance', angle: -45, length: 5 },
            { type: 'distance', angle: -30, length: 5 },
            { type: 'distance', angle: -15, length: 5 },
            { type: 'distance', angle: +0, length: 5 },
            { type: 'distance', angle: +15, length: 5 },
            { type: 'distance', angle: +30, length: 5 },
            { type: 'distance', angle: +45, length: 5 },

            { type: 'distance', angle: -225, length: 3 },
            { type: 'distance', angle: -195, length: 3 },
            { type: 'distance', angle: -180, length: 5 },
            { type: 'distance', angle: -165, length: 3 },
            { type: 'distance', angle: -135, length: 3 },

            { type: 'distance', angle: -10, length: 10 },
            { type: 'distance', angle: -3, length: 10 },
            { type: 'distance', angle: +0, length: 10 },
            { type: 'distance', angle: +3, length: 10 },
            { type: 'distance', angle: +10, length: 10 },

            { type: 'distance', angle: +90, length: 7 },
            { type: 'distance', angle: -90, length: 7 },

            { type: 'speed' }

        ]
    };

    this.maxSteer = Math.PI / 7
    this.maxEngineForce = 10
    this.maxBrakeForce = 5
    this.maxBackwardForce = 2
    this.linearDamping = 0.5

    this.continuous = true

    this.contact = 0
    this.impact = 0

    this.world = world

    this.init()
};

car.TYPE = 2

car.prototype.init = function () {
    this.createPhysicalBody()

    this.sensors = sensors.build(this, this.options.sensors)
    this.speed = this.sensors[this.sensors.length - 1]

    this.states = 0 // sensor dimensonality

    for (var i = 0; i < this.sensors.length; i++) {
        this.states += this.sensors[i].dimensions
    }
    
    this.punishment = 0
    this.timer = 0.0
};

car.prototype.createPhysicalBody = function () {
    // Create a dynamic body for the chassis
    this.chassisBody = new p2.Body({
        mass: 1,
        damping: 0.2,
        angularDamping: 0.3
    });

    this.wheels = {}
    this.chassisBody.color = color.randomPastelHex();
    this.chassisBody.car = true;
    this.chassisBody.damping = this.linearDamping;

    var boxShape = new p2.Box({ width: 0.5, height: 1 });
    boxShape.entity = 2

    this.chassisBody.addShape(boxShape);
    this.chassisBody.gl_create = (function (sprite, r) {
        this.overlay = new PIXI.Graphics();
        this.overlay.visible = true;

        sprite.addChild(this.overlay);

        var wheels = new PIXI.Graphics()
        sprite.addChild(wheels)

        var w = 0.12, h = 0.22
        var space = 0.07
        var col = "#" + this.chassisBody.color.toString(16)
            col = parseInt(tc(col).darken(50).toHex(), 16)
        var alpha = 0.35, alphal = 0.9

        var tl = new PIXI.Graphics()
        var tr = new PIXI.Graphics()

        tl.beginFill(col, alpha)
        tl.position.x = -0.25
        tl.position.y = 0.5 - h / 2 - space
        tl.drawRect(-w / 2, -h / 2, w, h)
        tl.endFill()

        tr.beginFill(col, alpha)
        tr.position.x = 0.25
        tr.position.y = 0.5 - h / 2 - space
        tr.drawRect(-w / 2, -h / 2, w, h)
        tr.endFill()

        this.wheels.topLeft = tl
        this.wheels.topRight = tr

        wheels.addChild(tl)
        wheels.addChild(tr)

        wheels.beginFill(col, alpha)
        // wheels.lineStyle(0.01, col, alphal)
        wheels.drawRect(-0.25 - w / 2, -0.5 + space, w, h)
        wheels.endFill()

        wheels.beginFill(col, alpha)
        // wheels.lineStyle(0.01, col, alphal)
        wheels.drawRect(0.25 - w / 2, -0.5 + space, w, h)
        wheels.endFill()
    }).bind(this); 

    // Create the vehicle
    this.vehicle = new p2.TopDownVehicle(this.chassisBody);

    // Add one front wheel and one back wheel - we don't actually need four :)
    this.frontWheel = this.vehicle.addWheel({
        localPosition: [0, 0.5] // front
    });
    this.frontWheel.setSideFriction(50);

    // Back wheel
    this.backWheel = this.vehicle.addWheel({
        localPosition: [0, -0.5] // back
    })
    this.backWheel.setSideFriction(45) // Less side friction on back wheel makes it easier to drift
};

car.prototype.updateSensors = function () {
    var data = new Float64Array(this.states)
    for (var i = 0, k = 0; i < this.sensors.length; k += this.sensors[i].dimensions, i++) {
        this.sensors[i].update()
        data.set(this.sensors[i].read(), k)
    }

    if (k !== this.states) {
        throw 'unexpected';
    }

    this.drawSensors()

    return data
};


car.prototype.drawSensors = function () {
    if (this.overlay.visible !== true) {
        return ;
    }

    this.overlay.clear();

    for (var i = 0; i < this.sensors.length; i++) {
        this.sensors[i].draw(this.overlay);
    }
};

car.prototype.addToWorld = function () {
    this.chassisBody.position[0] = (Math.random() - .5) * this.world.size.w
    this.chassisBody.position[1] = (Math.random() - .5) * this.world.size.h
    this.chassisBody.angle = (Math.random() * 2.0 - 1.0) * Math.PI

    this.world.p2.addBody(this.chassisBody)
    this.vehicle.addToWorld(this.world.p2)

   this.world.p2.on("beginContact", (event) => {

        if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
            // this.onContact( Math.pow(this.chassisBody.velocity[1], 2) + Math.pow(this.chassisBody.velocity[0], 2) );
            this.contact++;
        }

   });

   this.world.p2.on("endContact", (event) => {

        if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
            this.contact--;
        }

   })

   this.world.p2.on("impact", (event) => {

        if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
            this.impact = Math.sqrt(Math.pow(this.chassisBody.velocity[0], 2) + Math.pow(this.chassisBody.velocity[1], 2))
        }

   })
};

car.prototype.handleKeyInput = function (k) {
    // Steer value zero means straight forward. Positive is left and negative right.
    // this.frontWheel.steerValue = this.maxSteer * (k.getN(37) - k.getN(39));

    // // Engine force forward
    // this.backWheel.engineForce = k.getN(38) * this.maxEngineForce;
    // this.backWheel.setBrakeForce(0);

    // if(k.get(40)) {
    //     if(this.backWheel.getSpeed() > 0.1){
    //         // Moving forward - add some brake force to slow down
    //         this.backWheel.setBrakeForce(this.maxBrakeForce);
    //     } else {
    //         // Moving backwards - reverse the engine force
    //         this.backWheel.setBrakeForce(0);
    //         this.backWheel.engineForce = -this.maxBackwardForce;
    //     }
    // }

    if (k.getD(83) === 1) {
        this.overlay.visible = !this.overlay.visible;
    }
};

car.prototype.handle = function (throttle, handlebar) {

    // Steer value zero means straight forward. Positive is left and negative right.
    this.frontWheel.steerValue = this.maxSteer * handlebar

    // Engine force forward
    var force = throttle * this.maxEngineForce
    if (force < 0) {

        if (this.backWheel.getSpeed() > 0.1) {
            this.backWheel.setBrakeForce(-throttle * this.maxBrakeForce)
            this.backWheel.engineForce = 0.0
        }

        else {
            this.backWheel.setBrakeForce(0)
            this.backWheel.engineForce = throttle * this.maxBackwardForce
        }

    }

    else {
        this.backWheel.setBrakeForce(0)
        this.backWheel.engineForce = force
    }

    this.wheels.topLeft.rotation = this.frontWheel.steerValue * 0.7071067812
    this.wheels.topRight.rotation = this.frontWheel.steerValue * 0.7071067812
};


module.exports = car;