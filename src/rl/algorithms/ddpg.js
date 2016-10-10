
class DDPG {

	constructor(agent) {
		// options
		this.options = Object.assign({

			alpha: 0.1, // advantage learning (AL) http://arxiv.org/pdf/1512.04860v1.pdf; increase action-gap
			theta: 0.001, // soft target updates

		}, agent.options)

		// networks
		this.actor = agent.options.actor.newState()
		this.critic = agent.options.critic.newState()

		// target networks
		if (agent.options.targetActor) {
			if (agent.options.targetActor.model !== this.actor.model)
				throw 'Target actor model not right';

			this.targetActor = agent.options.targetActor.newState()
		}

		else {
			this.targetActor = this.actor.model.newState() // agent.options.target.actor.newState()
		}
			
		if (agent.options.targetCritic) {
			if (agent.options.targetCritic.model !== this.critic.model)
				throw 'Target critic model not right';

			this.targetCritic = agent.options.targetCritic.newState()
		}

		else {
			this.targetCritic = this.critic.model.newState() // agent.options.target.actor.newState()
		}
			
		this.targetActor.configuration.copyParametersFrom(this.actor.configuration)
		this.targetCritic.configuration.copyParametersFrom(this.critic.configuration)

		// network weight updates
		this.targetActorUpdate = this.progressiveCopy.bind(this, this.actor.configuration)
		this.targetCriticUpdate = this.progressiveCopy.bind(this, this.critic.configuration)

		// optimizer
		this.actor.configuration.useOptimizer({
			type: 'ascent',
			method: 'adadelta',
			regularization: { l2: 1e-3 }
		})

		this.critic.configuration.useOptimizer({
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

		if (this.actor.in.w.length !== this.agent.input)
			throw 'actor input length insufficient'

		if (this.critic.in.w.length !== this.agent.input + this.agent.actions)
			throw 'critic input length insufficient'
	}

	act(state, target) {
		if (target) {
			return this.targetActor.forward(state)
		}

		return this.actor.forward(state)
	}

	value(state, action, target) {
		target = target ? this.targetCritic : this.critic

		target.in.w.set(state, 0)
		target.in.w.set(action, this.input)

		return target.forward()[0]
	}

	optimize(e, descent = true) {
		var target = e.target()
		var value = e.estimate()

		var grad = value - target
		var gradAL = grad

		if (this.options.alpha > 0) {
			gradAL = grad + this.options.alpha * (value - this.agent.evaluate(e.state0, true)) // advantage learning
		}

		if (isNaN(gradAL)) {
			console.log(target)
			console.log(value)
			console.log(grad)
			console.log(gradAL)

			throw 'NaN'

			return 0.0
		}

		if (descent) {
			var isw = this.buffer.getImportanceSamplingWeight(e)
			this.critic.backwardWithGradient(gradAL * isw)
			this.critic.configuration.accumulate()
			this.teach(e, isw)
		}

		return 0.5 * gradAL * gradAL // Math.pow(this.teach(e, isw, descent) - target, 2)
	}

	teach(e, isw = 1.0, descent = true) {
		var action = this.actor.forward(e.state0)  // which action to take?
		var val = this.value(e.state0, action) // how good will the future be, if i take this action?
		var grad = this.critic.derivatives(0, false) // how will the future change, if i change this action

		for (var i = 0; i < this.options.actions; i++) {
			this.actor.out.dw[i] = grad[this.input + i] * isw
		}

		if (descent) {
			this.actor.backward() // propagate change
			this.actor.configuration.accumulate()
		}
	}

	learn() {
		// Improve through batch accumuluated gradients
		this.actor.configuration.optimize(false)
		this.critic.configuration.optimize(false)

		// Copy actor and critic to target networks slowly
		this.targetNetworkUpdates()
	}

	targetNetworkUpdates() {
		this.targetActor.configuration.forEachParameter(this.targetActorUpdate)
		this.targetCritic.configuration.forEachParameter(this.targetCriticUpdate)
	}

	progressiveCopy(net, param, index) {
		var _theta = this.options.theta
		for (var i = 0; i < param.w.length; i++) {
			param.w[i] = _theta * net.parameters[index].w[i] + (1.0 - _theta) * param.w[i]
		}
	}


	import(params) {
		var a_count = this.actor.configuration.countOfParameters
		var c_count = this.critic.configuration.countOfParameters

		if (params.length !== a_count + c_count)
			return false;

		var actor = params.subarray(0, a_count)
		var critic = params.subarray(a_count, a_count + c_count)

		this.actor.configuration.read(actor)
		this.critic.configuration.read(critic)

		this.targetActor.configuration.read(actor)
		this.targetCritic.configuration.read(critic)

		return true;
	}

	export() {
		var a_count = this.actor.configuration.countOfParameters
		var c_count = this.critic.configuration.countOfParameters

		var params = new Float64Array(a_count + c_count)

		params.set(this.actor.configuration.write(), 0)
		params.set(this.critic.configuration.write(), a_count)

		return params
	}

}

module.exports = DDPG;