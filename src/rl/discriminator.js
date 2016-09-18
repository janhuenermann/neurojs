var Network = require('../network.js')

module.exports = class DiscriminatorNetwork {

	constructor(agent) {
		this.model = new Network.Model([

	        { type: 'input', size: agent.states + agent.actions },
	        { type: 'fc', size: 40, activation: 'relu' },
	        { type: 'fc', size: 30, activation: 'relu' },
	        { type: 'fc', size: 30, activation: 'relu' },
	        { type: 'fc', size: 1, activation: 'sigmoid' },
	        { type: 'regression' }

	    ])

		this.net = this.model.newConfiguration().newState()
		this.net.configuration.useOptimizer({
			type: 'descent',
			method: 'adadelta',
			regularization: { l2: 0.05 }
		})

		this.agent = agent
	}

	probability(state, action) { // probability that this is not random
		return this.net.forward(this.build(state, action))[0]
	}

	learn(state, action) {

		for (var i = 0; i < 3; i++) {
			this.guess0 = this.net.forward(/* this.build(state, Float64Array.noise(action.length)) */ Float64Array.noise(state.length + action.length))[0]
			this.net.backward(1.0)
			this.net.configuration.accumulate(1 / 3.0)
		}
		

		this.guess1 = this.net.forward(this.build(state, action))[0]
		this.net.backward(0.0)
		this.net.configuration.accumulate()

		this.loss = 1.0 - this.guess0 + this.guess1

		return this.net.derivatives(0).slice(-action.length)
	}

	derivatives(state, action) {
		this.net.forward(this.build(state, action))	
		return this.net.derivatives(0).slice(-action.length)
	}

	build(state, action) {
		var IN = new Float64Array(this.agent.states + this.agent.actions)
		IN.set(state, 0)
		IN.set(action, state.length)

		return IN
	}

	propagate(input) { 
		this.guess = this.net.forward(input)[0]

		// how to increase/decrease likelyhood of not being random
		return this.net.derivatives(0)
	}

}