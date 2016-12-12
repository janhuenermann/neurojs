var Algorithm = require('./algorithm.js')

class DQN extends Algorithm {

	constructor(agent) {
		// options
		this.options = Object.assign({

			alpha: 0.1, // advantage learning (AL) http://arxiv.org/pdf/1512.04860v1.pdf; increase action-gap
			theta: 0.001, // soft target updates
			
			learningSteps: 100e3,
			learningStepsBurnin: 3e3,

			epsilonMin: 0.05,
			epsilonAtTestTime: 0.05


		}, agent.options)

		//
		this.net = agent.options.network.newState()
		this.target = this.net.model.newState() // agent.options.target.actor.newState()
		// this.target.configuration.copyParametersFrom(this.net.configuration)

		//
		this.targetWeightCopy = this.progressiveCopy.bind(this, this.net.configuration)

		this.net.configuration.useOptimizer({
			type: 'descent',
			method: 'adadelta',
            regularization: { l2: 1e-3 }
		})

		// agent
		this.agent = agent
		this.buffer = agent.buffer

		this.states = this.agent.states
		this.actions = this.agent.actions
		this.input = this.agent.input
	}

	// what to do?
	act(state, target) {

		if (this.agent.learning)
			this.epsilon = Math.max(1.0 - Math.max((this.agent.age - this.options.learningStepsBurnin) / this.options.learningSteps, 0.0), this.options.epsilonMin)
		else
			this.epsilon = this.options.epsilonAtTestTime

		if (Math.random() <= this.epsilon) {
			return Math.randi(0, this.actions)
		}

		this.net.forward(state)

		return this.net.out.w.maxi()

	}

	// how good is an action at state
	value(state, action, target) {
		target = target == null ? this.net : this.target
		target.forward(state)
		return target.out.w[action]
	}

	// replay
	optimize(e, descent = true) {
		var target = e.target()
		var value = e.estimate()

		var grad = value - target
		var gradAL = grad + this.options.alpha * (value - this.agent.evaluate(e.state0, true)) // advantage learning
		var isw = this.buffer.getImportanceSamplingWeight(e)

		this.net.out.dw.fill(0.0)
		this.net.out.dw[e.action0] = gradAL * isw

		if (descent) {
			this.net.backward()
			this.net.configuration.accumulate()
		}

		return gradAL * gradAL * 0.5
	}

	// adjust weights etc
	learn() {
		this.net.configuration.optimize(false)
		this.targetUpdate()
	}


	targetUpdate() {
		if (this.options.theta < 1) {
			this.target.configuration.forEachParameter(this.targetWeightCopy)
		}
	}

	progressiveCopy(net, param, index) {
		var _theta = this.options.theta
		for (var i = 0; i < param.w.length; i++) {
			param.w[i] = _theta * net.parameters[index].w[i] + (1.0 - _theta) * param.w[i]
		}
	}


	import(params) {
		if (params.length !== this.net.configuration.countOfParameters)
			return false

		this.net.configuration.read(params)

		return true
	}

	export() {
		return this.net.configuration.write()
	}

}

module.exports = DQN;