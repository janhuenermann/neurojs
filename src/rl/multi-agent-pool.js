
class MultiAgentPool {

	constructor() {
		this.agents = []
	}

	add(agent) {
		agent.pool = this
		this.agents.push(agent)
	}

	learn() {
		this.critic.freeze()
		this.target.freeze()

		for (var i = 0; i < this.agents.length; i++) {
			if (this.agents[i].options.startLearningAt > this.agents[i].age)
				continue 

			this.agents[i].replay()

			if (i === this.agents.length - 1) { // last one
				this.critic.freeze(false)
				this.target.freeze(false)
			}

			this.agents[i].algorithm.learn()
		}
	}

}

module.exports = MultiAgentPool