class Experience {

	constructor(agent) {
		this.agent = agent
		this.learnSteps = 0

		if (agent.options.type === 'sarsa')
			this.target = this.__sarsa_target
		else
			this.target = this.__q_target
	}

	__q_target() {
		return this.reward0 + this.agent.options.discount * this.agent.evaluate(this.state1, true) // this.agent.value(this.state1, this.agent.act(this.state1, true), true)
	}

	__sarsa_target() {
		return this.reward0 + this.agent.options.discount * this.agent.value(this.state1, this.action1, true)
	}

	estimate() {
		return this.value = this.agent.value(this.state0, this.action0)
	}

	step() {
		this.loss = this.agent.algorithm.optimize(this)

		this.learnSteps++
		this.lastLearnedAt = this.agent.age

		return this.loss
	}

	init() {
		this.loss = this.agent.algorithm.optimize(this, false)
		this.atAge = this.agent.age
	}

	get priority() {
		if (this.loss === undefined)
			return undefined

		return Math.pow(this.loss, this.agent.options.beta || 0.5)
	}

}

module.exports = Experience