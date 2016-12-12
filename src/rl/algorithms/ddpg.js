var network = require('../../network.js')
var shared = require('../../shared.js')

var NetOnDisk = require('../../storage.js')
var Algorithm = require('./algorithm.js')


/* Deep deterministic policy gradient */
class DDPG extends Algorithm {

	constructor(agent) {
		super()
		// options
		this.options = Object.assign({
			alpha: 0, // advantage learning (AL) http://arxiv.org/pdf/1512.04860v1.pdf; increase action-gap
			theta: 0.001, // soft target updates
		}, agent.options)


		this.actor = new shared.NetworkWrapper()
		this.critic = new shared.NetworkWrapper()

		// target networks

		var targetCreate = (wrapper, state) => {
			wrapper.live = state

			if (this.options.theta < 1) {
				wrapper.target = wrapper.live.model.newState()
			}
			
			else {
				wrapper.target = wrapper.live
			}
		}

		this.actor.on('set', targetCreate)
		this.critic.on('set', targetCreate)

		// network validations

		this.actor.on('set', (wrapper, state) => {
			if (state.in.w.length !== this.agent.input) {
				throw 'actor input length insufficient'
			}

			if (state.out.w.length !== this.agent.actions) {
				throw 'actor output insufficient'
			}
		})

		this.critic.on('set', (wrapper, state) => {
			if (state.in.w.length !== this.agent.input + this.agent.actions) {
				throw 'critic input length insufficient'
			}

			if (state.out.w.length !== 1) {
				throw 'critic output length insufficient'
			}
		})

		// optimizer

		this.actor.useOptimizer({
			type: 'ascent',
			method: 'adadelta',
			regularization: { l2: 1e-2 }
		})

		this.critic.useOptimizer({
			type: 'descent',
			method: 'adadelta',
            regularization: { l2: 1e-3 }
		})

		// agent
		this.agent = agent

		this.input = agent.input
		this.buffer = agent.buffer

		// network weight updates
		this.targetActorUpdate = this.progressiveCopy.bind(this, this.actor)
		this.targetCriticUpdate = this.progressiveCopy.bind(this, this.critic)

		// adopt networks
		this.actor.set(this.options.actor)
		this.critic.set(this.options.critic)
	}

	act(state, target) {
		if (target) {
			return this.actor.target.forward(state)
		}

		return this.actor.live.forward(state)
	}

	value(state, action, target) {
		var net = target ? this.critic.target : this.critic.live

		net.in.w.set(state, 0)
		net.in.w.set(action, this.input)

		return net.forward()[0]
	}

	optimize(e, descent = true) {
		var target = e.target()
		var value = e.estimate()

		var grad = value - target
		var gradAL = grad

		if (this.options.alpha > 0) {
			gradAL = grad + this.options.alpha * (value - this.evaluate(e.state0, true)) // advantage learning
		}

		if (descent) {
			var isw = this.buffer.getImportanceSamplingWeight(e)
			this.critic.live.backwardWithGradient(gradAL * isw)
			this.critic.live.configuration.accumulate()
			this.teach(e, isw)
		}

		return 0.5 * gradAL * gradAL // Math.pow(this.teach(e, isw, descent) - target, 2)
	}

	teach(e, isw = 1.0, descent = true) {
		var action = this.actor.live.forward(e.state0)  // which action to take?
		var val = this.value(e.state0, action) // how good will the future be, if i take this action?
		var grad = this.critic.live.derivatives(0, false) // how will the future change, if i change this action

		for (var i = 0; i < this.options.actions; i++) {
			this.actor.live.out.dw[i] = grad[this.input + i] * isw
		}

		if (descent) {
			this.actor.live.backward() // propagate change
			this.actor.config.accumulate()
		}
	}

	learn() {
		// Improve through batch accumuluated gradients
		this.actor.optimize()
		this.critic.optimize()
		
		// Copy actor and critic to target networks slowly
		this.targetNetworkUpdates()
	}

	targetNetworkUpdates() {
		this.actor.target.configuration.forEachParameter(this.targetActorUpdate)
		this.critic.target.configuration.forEachParameter(this.targetCriticUpdate)
	}

	progressiveCopy(net, param, index) {
		if (this.options.theta >= 1) {
			return 
		}

		// _ = network in use, no _ = target network
		var _theta = this.options.theta, _paramw = net.config.parameters[index].w
		var  theta = 1.0 - _theta,        paramw = param.w

		for (var i = 0; i < param.w.length; i++) {
			paramw[i] = _theta * _paramw[i] + theta * paramw[i]
		}
	}


	import(file) {
		var multiPart = NetOnDisk.readMultiPart(file)
		this.actor.set(multiPart.actor)
		this.critic.set(multiPart.critic)
	}

	export() {
		return NetOnDisk.writeMultiPart({
			'actor': this.actor.config,
			'critic': this.critic.config
		})
	}

}

module.exports = DDPG;