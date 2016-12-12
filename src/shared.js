class EventRadio {

	constructor() {
		this.events = {}
	}


	on(event, callback) {
		if (!(event in this.events)) {
			this.events[event] = []
		}

		this.events[event].push(callback)
	}

	trigger(event, args = []) {
		if (event in this.events) {
			for (var i = 0; i < this.events[event].length; i++) {
				this.events[event][i].apply(undefined, [this].concat(args));
			}
		}
	}

}

class NetworkPool extends EventRadio {

	constructor(names) {
		this.states = {}
	}

	add(name, wrapper) {
		this.states[name] = wrapper
		wrapper.pool = this
	}

	set(name, value) {
	}

	dispatchOptimization() {
	}

}

class NetworkWrapper extends EventRadio {

	set(value) {
		var state

		if (value.constructor.name === 'State') {
			state = value
		}

		else if (value.constructor.name === 'Configuration' || value.constructor.name === 'Model') {
			state = value.newState()
		}

		this.net = state
		this.config = state.configuration
		this.model = state.model

		this.trigger('set', [ state ])
	}

	useOptimizer(optim) {
		this.optim = optim

		this.on('set', () => {
			if (this.optim !== undefined)
				this.config.useOptimizer(this.optim)
		})

		if (this.config)
			this.config.useOptimizer(optim)
	}

}

module.exports = {
	NetworkWrapper, NetworkPool
}