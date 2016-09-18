var color = require('./color.js'),
    sensors = require('./sensors.js'),
    tc = require('./tiny-color.js');

function car(opt) {
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

    this.maxSteer = opt.maxSteer || Math.PI / 5;
    this.maxEngineForce = opt.maxEngineForce || 4;
    this.maxBrakeForce = opt.maxBrakeForce || 5;
    this.maxBackwardForce = opt.maxBackwardForce || 2;

    this.continuous = true
    this.frequency = 10
    this.discount = .75

    this.init();
};

car.TYPE = 2

car.prototype.init = function () {
    this.createPhysicalBody()
    this.sensors = sensors.build(this, this.options.sensors)
    this.speed = this.sensors[this.sensors.length - 1]

    this.createBrain()

    this.punishment = 0
    this.timer = 0.0
};

car.prototype.createBrain = function () {

    var states = 0

    for (var i = 0; i < this.sensors.length; i++) {
        states += this.sensors[i].dimensions
    }

    if (this.continuous) {

        var actions = 2
        var temporal = 1

        var input = states + (states + actions) * temporal

        if(!car.actor)
            car.actor = new window.neurojs.Network.Model([

                { type: 'input', size: input },
                { type: 'fc', size: 60, activation: 'relu' },
                { type: 'fc', size: 60, activation: 'relu', dropout: 0.4 },
                { type: 'fc', size: actions, activation: 'tanh' },
                { type: 'regression' }

            ])

        if(!car.critic)
            car.critic = new window.neurojs.Network.Model([

                { type: 'input', size: input + actions },
                { type: 'fc', size: 50, activation: 'relu' },
                { type: 'fc', size: 50, activation: 'relu' },
                { type: 'fc', size: 1 },
                { type: 'regression' }

            ]).newConfiguration()

        var exp_size = 3600 * this.frequency // store one hour of memories

        this.brain = new window.neurojs.Agent({

            actor: car.actor.newConfiguration(),
            critic: car.critic,

            states: states,
            actions: actions,

            algorithm: 'ddpg',

            temporalWindow: temporal, 

            discount: Math.pow(this.discount, 1.0 / this.frequency),

            experience: exp_size, 
            learningPerTick: Math.floor(640 / this.frequency), 

            theta: 0.01 / this.frequency,

        })

        // window.neurojs.Loader.loadAgent('checkpoint/car-ddpg-1-age75000.bin', this.brain)

    }

    else {

        var actions = car.actions.length
        var temporal = 1

        var input = states + (states + actions) * temporal

        var net = new window.neurojs.Network.Model([

            { type: 'input', size: input },
            { type: 'fc', size: 80, activation: 'relu' },
            { type: 'fc', size: 60, activation: 'relu' },
            { type: 'fc', size: actions },
            { type: 'regression' }

        ])

        this.brain = new window.neurojs.Agent({

            network: net.newConfiguration(),

            states: states,
            actions: actions,

            algorithm: 'dqn',

            temporalWindow: temporal, 

            discount: Math.pow(this.discount, 1.0 / this.frequency)

        })

    }

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
    this.frontWheel.setSideFriction(6);

    // Back wheel
    this.backWheel = this.vehicle.addWheel({
        localPosition: [0, -0.5] // back
    });
    this.backWheel.setSideFriction(6); // Less side friction on back wheel makes it easier to drift
};

car.prototype.update = function (dt) {
    this.updateBrain(dt)
};

car.prototype.updateSensors = function () {
    var data = []
    for (var i = 0; i < this.sensors.length; i++) {
        this.sensors[i].update()
        data[i] = this.sensors[i].read()
    }

    this.drawSensors()

    return Array.prototype.concat.apply([], data)
};

car.actions = [ [ 0, -1 ], [ 0, +1 ], [ 1, -1 ], [ 1, +1 ], [ -1, -1 ], [ -1, +1 ], [ 1, 0 ], [ -1, 0 ], [ 0, 0 ] ]
car.prototype.updateBrain = function (dt) {
    this.timer += dt

    if (this.timer >= 1.0 / this.frequency) {
        var d = this.updateSensors()

        this.brain.learn(
            Math.pow(this.chassisBody.velocity[1], 2) - 0.4 * Math.pow(this.chassisBody.velocity[0], 2) - this.punishment
        )

        if (this.continuous) {
            this.action = this.brain.policy(d)
        }

        else {
            var action_idx = this.brain.policy(d)
            this.action = car.actions[action_idx]
        }
        

        this.timer = 0.0
        this.punishment = 0.0
    }
    
    if (this.action)
        this.handle(this.action[0], this.action[1])
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

car.prototype.addToWorld = function (world) {
    world.addBody(this.chassisBody);
    this.vehicle.addToWorld(world);

   world.on("beginContact",(function(event){
    if (event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)
        this.punishment = 50; 
   }).bind(this));
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

    this.wheels.topLeft.rotation = this.frontWheel.steerValue * 0.5
    this.wheels.topRight.rotation = this.frontWheel.steerValue * 0.5
};

module.exports = car;