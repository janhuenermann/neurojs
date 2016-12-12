var car = require('./car.js');

function agent(opt, world) {
    this.car = new car(world, {})
    this.options = opt

    this.world = world
    this.frequency = 15
    this.reward = 0
    this.rewardBonus = 0
    this.loaded = false

    this.loss = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(null, null)
    }

    this.car.onContact = (speed) => {
    	this.rewardBonus -= Math.max(speed, 50.0)
    };
    
};

agent.prototype.init = function (actor, critic) {
    var actions = 2
    var temporal = 1
    var states = this.car.states

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.95, 

        experience: 75e3, 
        learningPerTick: 40, 
        startLearningAt: 900,

        theta: 0.05, // progressive copy

        alpha: 0.1 // advantage learning

    })

    this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.actions = actions
    this.car.addToWorld()
	this.loaded = true
};

agent.prototype.step = function (dt) {
	if (!this.loaded) {
		return 
	}

    this.timer++

    if (this.timer % this.timerFrequency === 0) {
        var d = this.car.updateSensors()
        var vel = this.car.chassisBody.velocity
        var speed = this.car.speed.velocity

        this.reward = Math.pow(vel[1], 2) - 0.1 * Math.pow(vel[0], 2) - this.car.contact * 10 - this.car.impact * 20

        if (Math.abs(speed) < 1e-2) { // punish no movement; it harms exploration
            this.reward -= 1.0 
        }

        this.loss = this.brain.learn(this.reward)
        this.action = this.brain.policy(d)
        
        this.rewardBonus = 0.0
        this.car.impact = 0
    }
    
    if (this.action) {
        this.car.handle(this.action[0], this.action[1])
    }

    return this.timer % this.timerFrequency === 0
};

agent.prototype.draw = function (context) {
};

module.exports = agent;