// var network = require('../network.js')
var Window = require('../math/window.js')
var Experience = require('./experience.js')
var Buffers = require('./replay-buffers.js')
var DQN = require('./algorithms/dqn.js')
var DDPG = require('./algorithms/ddpg.js')


class Agent {

	constructor(opt) {

		this.options = Object.assign({

			type: 'q-learning', // sarsa or q-learning
			experience: 25e3,
			discount: opt.discount || 0.98,
			learningPerTick: 64,
			temporalWindow: 0,

			buffer: Buffers.PrioritizedReplayBuffer,

			algorithm: 'ddpg',

			beta: 0.5, // how to prioritise experiences (0 = no prioritisation, 1 = full prioritisation)

		}, opt)

		// options
		this.states = this.options.states // state space
		this.actions = this.options.actions // action space
		this.input = this.states + this.options.temporalWindow * (this.states + this.actions) // extended state (over time)

		// settings
		this.buffer = new this.options.buffer(this.options.experience)
		this.history = {
			states: new Window(Math.max(2, this.options.temporalWindow)),
			actions: new Window(Math.max(2, this.options.temporalWindow)),
			inputs: new Window(2),
			rewards: new Window(2),
		}

		this.age = 1
		this.learning = true
		this.ready = true

		switch (this.options.algorithm) {
			case 'dqn':
				this.algorithm = new DQN(this); break
			case 'ddpg':
				this.algorithm = new DDPG(this); break
			default:
				throw 'unknown algorithm'
		}
	}

	/**
	 * Let the agent make an action, includes exploration through noise
	 * @param  {Array} state
	 * @return {Array}       An action
	 */
	policy(state) {
		if (!this.ready)
			return

		var input = this.getStateInputVector(state)
		var action = this.act(input)

		this.history.inputs.push(input)
		this.history.states.push(state)
		this.history.actions.push(action)
		this.acted = true

		return action
	}

	actionToVector(action) {
		if (action instanceof Float64Array)
			return action

		if (Number.isInteger(action))
			return Float64Array.oneHot(action, this.actions)

		throw 'action invalid'
	}

	getStateInputVector(state) {
		if (this.options.temporalWindow > 0) {
			var input = new Float64Array(this.input)
			var cursor = 0
			
			for (var t = this.options.temporalWindow - 1; t >= 0; t--) {
				if (this.history.states.size > t) {
					input.set(this.history.states.get(t), cursor)
					input.set(this.actionToVector( this.history.actions.get(t) ), cursor + this.states) 
				}
				
				cursor += this.states + this.actions
			}

			input.set(state, cursor)

			return input
		}

		return state
	}

	/**
	 * Simulate that the agent did an action
	 * @param  {Array} state
	 * @param  {Array} action
	 */
	simulate(state, action) {
		if (!this.ready)
			return

		var input = this.getStateInputVector(state)

		this.history.inputs.push(input)
		this.history.states.push(state)
		this.history.actions.push(action)
		this.acted = true
	}

	/**
	 * Adds an experience to the buffer and replays an batch of experiences
	 * @param  {Float} reward
	 * @return {Float}        The loss
	 */
	learn(reward) {
		if (!this.acted || !this.ready)
			return 

		this.acted = false
		this.history.rewards.push(reward)

		// Learning happens always one step after actually experiencing
		if (this.history.states.size < 2) 
			return

		if (this.learning === false)
			return

		// Create new experience
		var e = new Experience(this)
		e.action0 = this.history.actions.get(1)
		e.state0 = this.history.inputs.get(1)
		e.reward0 = this.history.rewards.get(1)
		e.state1 = this.history.inputs.get(0)
		e.action1 = this.history.actions.get(0) // for SARSA only
		e.init() // set loss etc.

		// Add experience to replay buffer
		this.buffer.add(e)

		// Get older
		++this.age 

		// Learn batch
		var loss = this.replay()

		// Execute algorithm
		this.algorithm.learn(e)
 
		return loss
	}

	replay() {		
		var batch = this.buffer.sample(this.options.learningPerTick), loss = 0.0

		for (var i = 0; i < batch.length; i++) {
			loss += batch[i].step()
		}

		this.buffer.updateAfterLearning(batch)

		return loss / batch.length
	}


	// 
	act(state, target) {
		return this.algorithm.act(state, target)
	}

	value(state, action, target)  {
		return this.algorithm.value(state, action, target)
	}

	evaluate(state, target) {
		return this.value(state, this.act(state, target), target)
	}



	// utility functions
	export() {
		return this.algorithm.export()
	}

	import(params) {
		this.algorithm.import(params)
	}

}

module.exports = Agent