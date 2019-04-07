var car = require('./car.js');

function agent(opt, world) {
    this.car = new car(world, {});
    this.options = opt;

    this.world = world;
    this.frequency = 30;
    this.reward = 0;
    this.loaded = false;

    this.loss = 0;
    this.timer = 0.0;

    this.thrust = 0;
    this.steer = 0;
    this.velocity = [];

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null);
    }
};

agent.prototype.init = function (actor, critic) {
    var actions = 3
    var temporal = 1
    var states = this.car.sensors.dimensions

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({
        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.98, 
        learningRate: {
            actor: 1e-4, 
            critic: 1e-3
        },

        experience: 100e3, 
        // buffer: window.neurojs.Buffers.UniformReplayBuffer,

        learningPerTick: 40, 
        startLearningAt: 1200,

        theta: 0.050, // progressive copy
        alpha: 0.000, // advantage learning

        clipGradients: { action: 10, parameter: 10 },
        // actionDecay: 1e-5
    })

    // this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.actions = actions

    this.car.agent = this
    this.car.addToWorld()
	this.loaded = true
};

function sigmoid(x) { return 1.0/(1.0 + Math.exp(-x)); }

agent.prototype.step = function (dt) {
	if (!this.loaded) {
		return 
	}

    this.timer += dt

    if (this.timer >= 1.0 / this.frequency) {
        this.car.update()

        this.reward = this.generateReward(); // Math.max(-1.0, reward);

        this.loss = this.brain.learn(this.reward);
        this.action = this.brain.policy(this.car.sensors.data);

        let thrust = this.action[0];
        let steer = this.action[1];

        if (isNaN(steer) || isNaN(thrust)) {
            alert("STOPPING.. some action value is NaN. steer: " + steer + "; thrust: " + thrust);
        }

        this.thrust = thrust;
        this.steer = steer;
        
        this.car.impact = 0;
        this.car.reward = this.reward;

        this.car.step();
        this.timer = 0.0;
    }
    
    if (this.action) {
        this.car.handle(this.thrust, this.steer);
    }
};

agent.prototype.generateReward = function () {
    let pos = this.car.chassisBody.position;
    let vel = this.car.speed.local;
    let speed = this.car.speed.velocity;
    let reward = 0;

    const velOneSecAgo = this.velocity.length >= this.frequency 
                            ? this.velocity.shift()
                            : 0;

    // If we are not moving or have contact, this is bad.
    if (this.car.hasContact('obstacle') || this.car.hasContact('car')) {
        reward = -1; // avoid at all cost
    }
    else if (Math.abs(speed) < 0.05) {
        reward = -1; // standing still is bad
    }
    else if (speed < 0 || this.steer ** 2 > 0.50) {
        reward = 0; // no driving in circles
    }
    else {
        reward = Math.abs(vel[1]) / 36;
    }

    if (isNaN(reward)) {
        reward = 0;
    }

    this.velocity.push(vel[1]);

    return Math.min(Math.max(-1.0, reward), 2.0);
};

agent.prototype.draw = function (context) {
};

module.exports = agent;