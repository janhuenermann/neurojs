
class Algorithm {

	// what to do?
	act(state, target) { throw 'Not implemented' }

	// how good is an action at state
	value(state, action, target) { throw 'Not implemented' }

	// replay
	optimize(e, descent = true) { throw 'Not implemented' }

	// adjust weights etc
	learn() { throw 'Not implemented' }

	import(params) { throw 'Not implemented' }
	export() { throw 'Not implemented' }


	evaluate(state, target) {
		return this.value(state, this.act(state, target), target)
	}

}

module.exports = Algorithm