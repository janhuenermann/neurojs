"use strict";

var dot = require('./layers/dot.js')
var dropout = require('./layers/dropout.js')
var nonlinear = require('./layers/nonlinear.js')
var input = require('./layers/input.js')
var regression = require('./layers/regression.js')
var noise = require('./layers/noise.js')
var bayesian = require('./layers/bayesian.js')

var Size = require('./math/size.js')
var Tensor = require('./math/tensor.js')
var Optim = require('./optim.js')

var SharedConfiguration = require('./shared.js')

if (typeof window === 'undefined') {
	require('colors');
}

// defines how the network looks; which layers etc.
class Model {

	constructor(opt) {
		this.representation = opt
		this.build(opt)
	}

	build(opt) {
		this.layers = []

		var input = null
		var desc = Model.expand(opt)

		for(var i = 0; i < desc.length; i++) {
			var current = desc[i]
			var layer = Model.create(input, current)

			layer.label = current.label || undefined
			layer.index = i
			layer.model = this
			layer.options = current

			if (layer.dimensions.output)
				layer.size = layer.dimensions.output.length // convenience

			this.layers.push(layer)
			input = layer.dimensions.output
		}

		this.input = this.layers[0]
		this.output = this.layers[this.layers.length - 1]
	}

	newConfiguration() {
		return new Configuration(this)
	}

	newState() {
		return this.newConfiguration().newState()
	}

	numericalGradientCheck() {
		var config = this.newConfiguration()
		var state = config.newState()
		var diff = 1e-5

		function clear() {
			// clear gradients
			for (var i = 0; i < config.parameters.length; i++) {
				if (config.parameters[i]) 
					config.parameters[i].dw.fill(0.0)
			}
		}

		function analyse(param, index) {
			clear.call(this)

			state.forward(input)
			state.backward(output)

			return config.parameters[param].dw[index]
		}

		function loss() {
			state.forward(input)
			return state.loss(output)
		}

		function measure(param, index) {
			var orig = config.parameters[param].w[index]
			config.parameters[param].w[index] = orig - diff
			var loss1 = loss.call(this)
			config.parameters[param].w[index] = orig + diff
			var loss2 = loss.call(this)
			config.parameters[param].w[index] = orig

			return (loss2 - loss1) / (2 * diff)
		}

		function checkWeight(param, index) {
			var analytical = analyse.call(this, param, index)
			var numerical = measure.call(this, param, index)
			var divisor = Math.abs(analytical)

			return Math.abs(numerical - analytical) / (divisor !== 0 ? divisor : 1)
		}


		var input = Float64Array.filled(this.input.size, 1.0)
		var output = Float64Array.filled(this.output.size, 1.0)

		console.log('Checking analytical gradients...'.magenta)

		var total = 0.0
		for (var i = config.parameters.length - 1; i >= 0; i--) {
			var param = config.parameters[i]
			if (param === undefined)
				continue 

			var offset = 0.0
			for (var j = 0; j < param.w.length; j++) {
				var error = checkWeight.call(this, i, j)
				if (isNaN(error)) {
					console.log('Layer ' + i)
					throw 'gradient is NaN'
				}

				offset += error * error
			}

			total += offset
			offset = Math.sqrt(offset) / param.w.length

			console.log('Layer ' + i + ' with gradient error of ' + offset)

			if (offset > 1e-3)  {
				throw 'analytical gradient unusually faulty'
			}
		}

		total = Math.sqrt(total) / config.countOfParameters

		console.log(('Mean gradient error is ' + total).bold.cyan)
		console.log('Gradients are looking good!'.bold.white)
	}


	static expand(opt) {
		var description = []
		for (var i = 0; i < opt.length; i++) {
			var current = opt[i]

			if (current.type === 'softmax' && current.classes)
				description.push({ type: 'fc', size: current.classes })

			description.push(current)

			if (current.activation)
				description.push({ type: current.activation })

			if (current.dropout)
				description.push({ type: 'dropout', probability: current.dropout })
		}

		if (![ 'softmax', 'regression' ].includes(description[description.length - 1].type))
			description.push({ type: 'regression' })

		return description
	}

	static create(inp, opt) {
		switch (opt.type) {
			case 'fc': return new dot.FullyConnectedLayer(inp, opt)
			case 'dropout': return new dropout.DropOutLayer(inp, opt)
			case 'sigmoid': return new nonlinear.SigmoidLayer(inp, opt)
			case 'tanh': return new nonlinear.TanhLayer(inp, opt)
			case 'relu': return new nonlinear.ReLuLayer(inp, opt)
			case 'input': return new input.InputLayer(inp, opt)
			case 'regression': return new regression.RegressionLayer(inp, opt)
			case 'softmax': return new regression.SoftmaxLayer(inp, opt)
			case 'noise': return new noise.UhlenbeckOrnsteinNoiseLayer(inp, opt)
			case 'bayesian': return new bayesian.VariationalBayesianLayer(inp, opt)
			case 'conf': return new bayesian.ConfidenceLayer(inp, opt)
		}

		throw 'error'
	}

}

// defines how the network behaves; parameter/weights etc.
class Configuration {

	constructor(model, parameters, optimizer) {
		this.model = model
		this.parameters = []
		this.optimizer = null
		this.countOfParameters = 0  

		for (var i = 0; i < this.model.layers.length; i++) {
			var layer = this.model.layers[i]
			if (!layer.dimensions.parameters) {
				continue 
			}

			var param = this.parameters[i] = new Tensor(layer.dimensions.parameters)
			if (parameters && i in parameters) // copy from
				param.w.set(parameters[i].w)
			else if (layer.initialize) // initialize as new parameters
				layer.initialize(param)
			else  // random parameters
				param.w.randf(-1, 1)

			this.countOfParameters += layer.dimensions.parameters
		}

		if (optimizer) {
			this.useOptimizer(optimizer)
		}
	}


	useOptimizer(optimizer) {
		if (optimizer.constructor === Object)
			optimizer = new Optim(optimizer)

		this.optimizer = optimizer
		this.forEachParameter(param => optimizer.initialize(param))

		return optimizer
	}

	freeze(val = true) {
		this.freezed = val
	}

	optimize(accu = true) {
		if (accu) this.accumulate(Number.isInteger(accu) ? accu : undefined)
		this.forEachParameter(param => this.optimizer.apply(param))
	}
	
	accumulate(weighted) {
		this.forEachParameter(param => this.optimizer.accumulate(param, weighted))
	}



	forEachParameter(cb) {
		if (this.freezed) return
		for (var i = 0; i < this.parameters.length; i++) { 
			var param = this.parameters[i]
			if (param === undefined) 
				continue

			cb(param, i)
		}
	}

	copyParametersFrom(config) {
		if (config.model !== this.model)
			throw 'models must match'

		this.forEachParameter((function (param, index) {
			param.w.set(config.parameters[index].w)
		}).bind(this))
	}


	newState() {
		return new State(this)
	}

	clone() {
		return new Configuration(this.model, this.parameters, this.optimizer)
	}


	putWeights(arr) {
		var joined = arr

		if (arr.length !== this.countOfParameters)
			throw 'array doesnt match'

		for (var i = 0, p = 0; i < this.parameters.length; i++) { 
			var param = this.parameters[i]
			if (param === undefined) 
				continue

			param.w.set(joined.subarray(p, p + param.w.length))

			p += param.w.length
		}
	}

	pullWeights() {
		var joined = new Float64Array(this.countOfParameters)

		for (var i = 0, p = 0; i < this.parameters.length; i++) { 
			var param = this.parameters[i]
			if (param === undefined) 
				continue

			joined.set(param.w, p)

			p += param.w.length
		}

		return joined
	}


	share() {
		return new SharedConfiguration(this)
	}

}

// defines current network input/hidden/output-state; activations and gradients etc.
class State {

	constructor(configuration) {
		this.configuration = configuration
		this.model = this.configuration.model
		this.layers = this.model.layers

		this.tensors = [] // array of layer tensors; this.tensors[i] = output tensor of layer i
		this.contexts = [] 

		// First input + output of every layer
		for (var i = 0; i < this.layers.length + 1; i++) {
			if (i > 0 && this.layers[i - 1].passthrough) // if passthrough, just use last tensor
				this.tensors[i] = this.tensors[i - 1]
			else // if at i = layers.length, then use output of last layer as tensor size
				this.tensors[i] = new Tensor(i < this.layers.length ? this.layers[i].dimensions.input : this.layers[i - 1].dimensions.output)
		}
		
		for (var i = 0; i < this.layers.length; i++) {
			var layer = this.layers[i]
			var context = this.contexts[i] = new LayerContext({
				input: this.tensors[i],
				output: this.tensors[i + 1],
				parameters: this.configuration.parameters[i],
				state: this
			})

			Object.each(layer.storage || {}, function (k, v) {
				context[k] = new Float64Array(!isNaN(v) ? v : v.length);
			})
		}
 
		this.in = this.tensors[0]
		this.out = this.tensors[this.layers.length]

		this.__target = new Float64Array(this.out.w.length)
		this.__l_in = this.layers[0]
		this.__l_out = this.layers[this.layers.length - 1]
	}

	/**
	 * Evaluate network
	 * @param  {Float64Array} input
	 * @return {Float64Array} 
	 */
	forward(input, opt) {
		if (input != null) {
			this.__l_in.toInputVector(input, this.in.w) // use 'input' as input values, while converting it to a vector
		}

		this.options = opt || {} // set pass options
		this.activate() // activate all layers

		return this.output // return copy of output
	}

	/**
	 * Propagates error back, error is provided by subtracting desired from actual output values. 
	 * @param  {Float64Array | Int} desired
	 * @return {Float}         loss
	 */
	backward(desired) {
		if (desired != null) {
			this.__l_out.toGradientVector(desired, this.out.w, this.out.dw) // convert 'desired' to target vector
		}
		
		this.propagate() // propagate errors backwards

		return this.loss(desired) // return loss
	}

	/**
	 * Instead of regressing the network to have minimal error, you can provide your own gradient.
	 * @param  {Float64Array} grad
	 */
	backwardWithGradient(grad) {
		if (Array.isArray(grad))
			this.out.dw.set(grad)
		else if (this.out.dw.length === 1)
			this.out.dw[0] = grad
		else
			throw 'error grad not propagatable';

		this.propagate()
	}


	// get copy of current output
	get output() {
		return this.__l_out.result(this.contexts[this.__l_out.index])
	}

	// get loss of current 
	loss(desired) {
		if (desired === undefined)
			return 

		return this.__l_out.loss(this.contexts[this.__l_out.index], desired)
	}


	// not error gradient, but value gradient => how to increase/decrease n-th output value
	derivatives(n, clone = true) {
		this.out.dw.fill(0.0)
		this.out.dw[n] = 1.0

		this.propagate()

		if (clone)
			return this.in.dw.clone()

		return this.in.dw
	}


	// forward pass
	activate() {
		for (var i = 0; i < this.layers.length; i++) {
			if (this.layers[i].passthrough) 
				continue ;

			this.layers[i].forward(this.contexts[i])
		}
	}

	// backwards pass
	propagate() {
		// safety check
		for (var i = 0; i < this.out.dw.length; i++) {
			if (isNaN(this.out.dw[i])) {
				throw 'warning: terror!';
			}
		}

		for (var i = this.layers.length - 1; i >= 0; i--) {
			if (this.layers[i].passthrough) 
				continue ;

			this.layers[i].backward(this.contexts[i])
		}
	}

}

class LayerContext {

	constructor(opt) {
		this.input = opt.input
		this.output = opt.output
		this.params = opt.parameters
		this.state = opt.state
	}

}


module.exports = {
	Model, Configuration, State
};