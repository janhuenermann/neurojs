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

class ConfigPool extends EventRadio {

	constructor(names) {
		super()
		this.states = {}
		this.configs = {}
		this.requested = []
	}

	add(name, wrapper) {
		if (!(name in this.states)) {
			this.states[name] = []
		}

		if (name in this.configs) {
			wrapper.set(this.configs[name])
		}

		this.states[name].push(wrapper)
		wrapper.pool = this
		wrapper.__pool_name = name

		this.trigger('add', [ wrapper, name ])
		this.trigger('add ' + name, [ wrapper ])
	}

	set(name, config) {
		if (name in this.states) {

			for (var i = 0; i < this.states[name].length; i++) {
				this.states[name][i].set(config)
			}

		}

		this.configs[name] = config
	}

	step() {
		for (var i = 0; i < this.requested.length; i++) {
			var name = this.requested[i]
			this.configs[name].optimize(false)
		}

		this.requested = []
	}

	requestOptimisation(wrapper) {
		if (wrapper.__pool_name === undefined || !(wrapper.__pool_name in this.configs)) 
			return false

		if (this.requested.indexOf(wrapper.__pool_name) >= 0)
			return true

		this.requested.push(wrapper.__pool_name)

		return true
	}

}

class NetworkWrapper extends EventRadio {

	constructor() {
		super()

		this.on('set', () => {
			if (this.optim !== undefined)
				this.config.useOptimizer(this.optim)
		})
	}

	set(value) {
		var state

		if (!value) {
			return
		}

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

		if (this.config) {
			this.config.useOptimizer(optim)
		}
	}

	optimize() {
		if (this.pool && this.pool.requestOptimisation(this)) {
			return 
		}
		
		this.config.optimize(false)
	}

}

module.exports = {
	NetworkWrapper, ConfigPool
}