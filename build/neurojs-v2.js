/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	__webpack_require__(1);

	var neurojs = {

		Network: __webpack_require__(2),
		Agent: __webpack_require__(27),
		Optim: __webpack_require__(12),
		Loader: __webpack_require__(33)

	};

	if (typeof window !== 'undefined') {
		window.neurojs = neurojs;
	} else {
		module.exports = neurojs;
	}

/***/ },
/* 1 */
/***/ function(module, exports) {

	if (Float64Array.prototype.fill === undefined) Float64Array.prototype.fill = function (v) {
	    for (var i = 0; i < this.length; i++) {
	        this[i] = v;
	    }
	};

	Object.assign(Math, {

	    statistics: true,

	    randn() {
	        var U1,
	            U2 = this.randn.U2,
	            W,
	            mult;
	        if (U2) {
	            this.randn.U2 = null; // deactivate for next time
	            return U2;
	        }

	        do {
	            U1 = -1 + this.random() * 2;
	            U2 = -1 + this.random() * 2;
	            W = U1 * U1 + U2 * U2;
	        } while (W >= 1 || W === 0);

	        mult = Math.sqrt(-2 * Math.log(W) / W);
	        this.randn.U2 = U2 * mult;

	        return U1 * mult;
	    },

	    randf(a, b) {
	        return this.random() * (b - a) + a;
	    },

	    randi(a, b) {
	        return a + Math.floor(Math.random() * (b - a));
	    },

	    uhlenbeckOrnstein(old, theta, sigma, dt) {
	        return old - theta * old * dt + Math.sqrt(dt) * Math.randn(0.0, sigma);
	    }

	});

	Object.assign(Array, {

	    random(arr) {
	        return arr[Math.floor(Math.random() * arr.length)];
	    },

	    randomAndRemove() {
	        var index = Math.floor(Math.random() * this.length);
	        var value = this[index];
	        this.splice(index, 1);

	        return value;
	    },

	    sum(arr, valueFunc) {
	        valueFunc = valueFunc || (x => x);
	        var sum = 0.0;
	        for (var i = 0; i < arr.length; i++) {
	            sum += valueFunc(arr[i]);
	        }

	        return sum;
	    },

	    lowest(valueFunc) {
	        return this.reduce((a, b) => valueFunc(a) < valueFunc(b) ? a : b);
	    },

	    highest(valueFunc) {
	        return this.reduce((a, b) => valueFunc(a) > valueFunc(b) ? a : b);
	    },

	    sample(probFunc) {
	        var des = Math.random();
	        var pos = 0.0;
	        for (var i = 0; i < this.children.length; i++) {
	            if (des < (pos += prob[i])) return this.children[i];
	        }

	        return this.children[this.children.length - 1];
	    }

	});

	Object.assign(Float64Array, {

	    filled(n, v) {
	        return new Float64Array(n).fill(v);
	    },

	    oneHot(n, N) {
	        var vec = new Float64Array(N);
	        vec[n] = 1.0;
	        return vec;
	    },

	    noise(N, a, b) {
	        var vec = new Float64Array(N);
	        vec.randf(a || -1, b || 1);
	        return vec;
	    }

	});

	Object.assign(Float64Array.prototype, {

	    randn(mu, std) {
	        for (var i = 0; i < this.length; i++) {
	            this[i] = mu + std * Math.randn();
	        }
	    },

	    randf(a, b) {
	        for (var i = 0; i < this.length; i++) {
	            this[i] = Math.randf(a, b);
	        }
	    },

	    maxi() {
	        var maxv = -Infinity,
	            maxi = 0.0;
	        for (var i = 0; i < this.length; i++) {
	            if (this[i] > maxv) {
	                maxv = this[i];maxi = i;
	            }
	        }

	        return maxi;
	    },

	    clone() {
	        var copied = new Float64Array(this.length);
	        copied.set(this);
	        return copied;
	    },

	    diff(x, y) {
	        for (var i = 0; i < this.length; i++) {
	            this[i] = x[i] - y[i];
	        }
	    },

	    add(x, y) {
	        for (var i = 0; i < this.length; i++) {
	            this[i] = x[i] + y[i];
	        }
	    },

	    mult(x, y) {
	        for (var i = 0; i < this.length; i++) {
	            this[i] = x[i] * y;
	        }
	    }

	});

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var dot = __webpack_require__(3);
	var dropout = __webpack_require__(5);
	var nonlinear = __webpack_require__(6);
	var input = __webpack_require__(7);
	var regression = __webpack_require__(8);
	var noise = __webpack_require__(9);
	var bayesian = __webpack_require__(10);

	var Size = __webpack_require__(4);
	var Tensor = __webpack_require__(11);
	var Optim = __webpack_require__(12);

	if (typeof window === 'undefined') {
		__webpack_require__(13);
	}

	// defines how the network looks; which layers etc.
	class Model {

		constructor(opt) {
			this.build(opt);
		}

		build(opt) {
			this.layers = [];

			var input = null;
			var desc = Model.expand(opt);

			for (var i = 0; i < desc.length; i++) {
				var current = desc[i];
				var layer = Model.create(input, current);

				layer.label = current.label || undefined;
				layer.index = i;
				layer.model = this;
				layer.options = current;

				if (layer.dimensions.output) layer.size = layer.dimensions.output.length; // convenience

				this.layers.push(layer);
				input = layer.dimensions.output;
			}

			this.input = this.layers[0];
			this.output = this.layers[this.layers.length - 1];
		}

		newConfiguration() {
			return new Configuration(this);
		}

		newState() {
			return this.newConfiguration().newState();
		}

		numericalGradientCheck() {
			var config = this.newConfiguration();
			var state = config.newState();
			var diff = 1e-5;

			function clear() {
				// clear gradients
				for (var i = 0; i < config.parameters.length; i++) {
					if (config.parameters[i]) config.parameters[i].dw.fill(0.0);
				}
			}

			function analyse(param, index) {
				clear.call(this);

				state.forward(input);
				state.backward(output);

				return config.parameters[param].dw[index];
			}

			function loss() {
				state.forward(input);
				return state.loss(output);
			}

			function measure(param, index) {
				var orig = config.parameters[param].w[index];
				config.parameters[param].w[index] = orig - diff;
				var loss1 = loss.call(this);
				config.parameters[param].w[index] = orig + diff;
				var loss2 = loss.call(this);
				config.parameters[param].w[index] = orig;

				return (loss2 - loss1) / (2 * diff);
			}

			function checkWeight(param, index) {
				var analytical = analyse.call(this, param, index);
				var numerical = measure.call(this, param, index);
				var divisor = Math.abs(analytical);

				return Math.abs(numerical - analytical) / (divisor !== 0 ? divisor : 1);
			}

			var input = Float64Array.filled(this.input.size, 1.0);
			var output = Float64Array.filled(this.output.size, 1.0);

			console.log('Checking analytical gradients...'.magenta);

			var total = 0.0;
			for (var i = config.parameters.length - 1; i >= 0; i--) {
				var param = config.parameters[i];
				if (param === undefined) continue;

				var offset = 0.0;
				for (var j = 0; j < param.w.length; j++) {
					var error = checkWeight.call(this, i, j);
					if (isNaN(error)) {
						console.log('Layer ' + i);
						throw 'gradient is NaN';
					}

					offset += error * error;
				}

				total += offset;
				offset = Math.sqrt(offset) / param.w.length;

				console.log('Layer ' + i + ' with gradient error of ' + offset);

				if (offset > 1e-3) {
					throw 'analytical gradient unusually faulty';
				}
			}

			total = Math.sqrt(total) / config.countOfParameters;

			console.log(('Mean gradient error is ' + total).bold.cyan);
			console.log('Gradients are looking good!'.bold.white);
		}

		static expand(opt) {
			var description = [];
			for (var i = 0; i < opt.length; i++) {
				var current = opt[i];

				if (current.type === 'softmax' && current.classes) description.push({ type: 'fc', size: current.classes });

				description.push(current);

				if (current.activation) description.push({ type: current.activation });

				if (current.dropout) description.push({ type: 'dropout', probability: current.dropout });
			}

			if (!['softmax', 'regression'].includes(description[description.length - 1].type)) description.push({ type: 'regression' });

			return description;
		}

		static create(inp, opt) {
			switch (opt.type) {
				case 'fc':
					return new dot.FullyConnectedLayer(inp, opt);
				case 'fc-sa':
					return new dot.FullyConnectedLayerSelfAware(inp, opt);
				case 'dropout':
					return new dropout.DropOutLayer(inp, opt);
				case 'sigmoid':
					return new nonlinear.SigmoidLayer(inp, opt);
				case 'tanh':
					return new nonlinear.TanhLayer(inp, opt);
				case 'relu':
					return new nonlinear.ReLuLayer(inp, opt);
				case 'input':
					return new input.InputLayer(inp, opt);
				case 'regression':
					return new regression.RegressionLayer(inp, opt);
				case 'softmax':
					return new regression.SoftmaxLayer(inp, opt);
				case 'noise':
					return new noise.UhlenbeckOrnsteinNoiseLayer(inp, opt);
				case 'bayesian':
					return new bayesian.VariationalBayesianLayer(inp, opt);
			}

			throw 'error';
		}

	}

	// defines how the network behaves; parameter/weights etc.
	class Configuration {

		constructor(model, parameters) {
			this.model = model;
			this.parameters = [];
			this.optimizer = null;
			this.countOfParameters = 0;

			for (var i = 0; i < this.model.layers.length; i++) {
				var layer = this.model.layers[i];
				if (!layer.dimensions.parameters) {
					continue;
				}

				var param = this.parameters[i] = new Tensor(layer.dimensions.parameters);
				if (parameters && parameters.length === this.model.layers.length) // copy from
					param.w.set(parameters[i].w);else if (layer.initialize) // initialize as new parameters
					layer.initialize(param);else // random parameters
					param.w.randf(-1, 1);

				this.countOfParameters += layer.dimensions.parameters;
			}
		}

		useOptimizer(optimizer) {
			if (optimizer.constructor === Object) optimizer = new Optim(optimizer);

			this.optimizer = optimizer;
			this.forEachParameter(param => optimizer.initialize(param));

			return optimizer;
		}

		optimize(accu) {
			if (accu !== false) this.accumulate(Number.isInteger(accu) ? accu : undefined);
			this.forEachParameter(param => this.optimizer.apply(param));
		}

		accumulate(weighted) {
			this.forEachParameter(param => this.optimizer.accumulate(param, weighted));
		}

		forEachParameter(cb) {
			for (var i = 0; i < this.parameters.length; i++) {
				var param = this.parameters[i];
				if (param === undefined) continue;

				cb(param, i);
			}
		}

		copyParametersFrom(config) {
			if (config.model !== this.model) throw 'models must match';

			this.forEachParameter(function (param, index) {
				param.w.set(config.parameters[index].w);
			}.bind(this));
		}

		newState() {
			return new State(this);
		}

		duplicate() {
			return new Configuration(this.model, this.optimizer, this.parameters);
		}

		read(arr) {
			var joined = arr;

			if (arr.length !== this.countOfParameters) throw 'array doesnt match';

			for (var i = 0, p = 0; i < this.parameters.length; i++) {
				var param = this.parameters[i];
				if (param === undefined) continue;

				param.w.set(joined.subarray(p, p + param.w.length));

				p += param.w.length;
			}
		}

		write() {
			var joined = new Float64Array(this.countOfParameters);

			for (var i = 0, p = 0; i < this.parameters.length; i++) {
				var param = this.parameters[i];
				if (param === undefined) continue;

				joined.set(param.w, p);

				p += param.w.length;
			}

			return joined;
		}

	}

	// defines current network input/hidden/output-state; activations and gradients etc.
	class State {

		constructor(configuration) {
			this.configuration = configuration;
			this.model = this.configuration.model;
			this.layers = this.model.layers;

			this.tensors = []; // array of layer tensors; this.tensors[i] = output tensor of layer i
			this.contexts = [];

			// First input + output of every layer
			for (var i = 0; i < this.layers.length + 1; i++) {
				if (i > 0 && this.layers[i - 1].passthrough) // if passthrough, just use last tensor
					this.tensors[i] = this.tensors[i - 1];else // if at i = layers.length, then use output of last layer as tensor size
					this.tensors[i] = new Tensor(i < this.layers.length ? this.layers[i].dimensions.input : this.layers[i - 1].dimensions.output);
			}

			for (var i = 0; i < this.layers.length; i++) {
				var layer = this.layers[i];
				var context = this.contexts[i] = new LayerContext({
					input: this.tensors[i],
					output: this.tensors[i + 1],
					parameters: this.configuration.parameters[i],
					state: this
				});

				Object.each(layer.storage || {}, function (k, v) {
					context[k] = new Float64Array(!isNaN(v) ? v : v.length);
				});
			}

			this.in = this.tensors[0];
			this.out = this.tensors[this.layers.length];

			this.__target = new Float64Array(this.out.w.length);
			this.__l_in = this.layers[0];
			this.__l_out = this.layers[this.layers.length - 1];
		}

		/**
	  * Evaluate network
	  * @param  {Float64Array} input
	  * @return {Float64Array} 
	  */
		forward(input, opt) {
			if (input != null) {
				this.__l_in.toInputVector(input, this.in.w); // use 'input' as input values, while converting it to a vector
			}

			this.options = opt || {}; // set pass options
			this.activate(); // activate all layers

			return this.output; // return copy of output
		}

		/**
	  * Propagates error back, error is provided by subtracting desired from actual output values. 
	  * @param  {Float64Array | Int} desired
	  * @return {Float}         loss
	  */
		backward(desired) {
			if (desired != null) {
				this.__l_out.toGradientVector(desired, this.out.w, this.out.dw); // convert 'desired' to target vector
			}

			this.propagate(); // propagate errors backwards

			return this.loss(desired); // return loss
		}

		/**
	  * Instead of regressing the network to have minimal error, you can provide your own gradient.
	  * @param  {Float64Array} grad
	  */
		backwardWithGradient(grad) {
			if (!isNaN(grad) && this.out.dw.length === 1) this.out.dw[0] = grad;else this.out.dw.set(grad);

			this.propagate();
		}

		// get copy of current output
		get output() {
			return this.__l_out.result(this.contexts[this.__l_out.index]);
		}

		// get loss of current 
		loss(desired) {
			if (desired === undefined) return;

			return this.__l_out.loss(this.contexts[this.__l_out.index], desired);
		}

		// not error gradient, but value gradient => how to increase/decrease n-th output value
		derivatives(n, clone = true) {
			this.out.dw.fill(0.0);
			this.out.dw[n] = 1.0;

			this.propagate();

			if (clone) return this.in.dw.clone();

			return this.in.dw;
		}

		// forward pass
		activate() {
			for (var i = 0; i < this.layers.length; i++) {
				if (this.layers[i].passthrough) continue;

				this.layers[i].forward(this.contexts[i]);
			}
		}

		// backwards pass
		propagate() {
			for (var i = this.layers.length - 1; i >= 0; i--) {
				if (this.layers[i].passthrough) continue;

				this.layers[i].backward(this.contexts[i]);
			}
		}

	}

	class LayerContext {

		constructor(opt) {
			this.input = opt.input;
			this.output = opt.output;
			this.params = opt.parameters;
			this.state = opt.state;
		}

	}

	module.exports = {
		Model, Configuration, State
	};

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Size = __webpack_require__(4);

	class FullyConnectedLayer {

		constructor(input, opt) {
			opt.size = Size.derive(opt.size);

			this.dimensions = {
				input,
				output: opt.size,
				parameters: input.length * opt.size.length + opt.size.length
			};
		}

		forward(ctx) {
			var sum = 0.0,
			    X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w,
			    paramw = ctx.params.w;

			for (var i = 0; i < Y; i++) {
				sum = 0.0;
				for (var j = 0; j < X; j++) {
					sum += inpw[j] * paramw[i * X + j];
				}

				outw[i] = sum + paramw[X * Y + i];
			}
		}

		backward(ctx) {
			var sum = 0.0,
			    X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w,
			    paramw = ctx.params.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw,
			    paramdw = ctx.params.dw;

			for (var i = 0; i < X; i++) {
				sum = 0.0;
				for (var j = 0; j < Y; j++) {
					sum += paramw[j * X + i] * outdw[j];
					paramdw[j * X + i] = inpw[i] * outdw[j];
				}

				inpdw[i] = sum;
			}

			for (var i = 0; i < Y; i++) {
				paramdw[X * Y + i] = outdw[i];
			}
		}

		initialize(params) {
			if (this.options.init) {
				params.w.randf(this.options.init[0], this.options.init[1]);
				return;
			}

			var X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var dropout = this.options.dropout || 0;
			var elements = (1 - dropout) * (this.dimensions.input.length + this.dimensions.output.length);
			var scale = Math.sqrt(2.0 / elements);
			params.w.randn(0.0, scale);
		}

	}

	module.exports = {
		FullyConnectedLayer
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = class Size {

		static derive(val) {
			if (val instanceof Size) return val;

			if (Number.isInteger(val)) return new Size(1, 1, val);

			throw "could not derive size";
		}

		constructor(x, y, z) {
			this.x = x;
			this.y = y;
			this.z = z;
			this.length = this.x * this.y * this.z;
		}

		get dimensions() {
			if (this.x * this.y * this.z === 0) return 0;

			if (this.x * this.y === 1) return 1;

			if (this.x === 1) return 2;

			return 3;
		}

	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

	class DropOutLayer {

		constructor(input, opt) {
			this.dimensions = {
				input,
				output: input,
				parameters: 0
			};

			this.probability = opt.probability;
			this.storage = {
				activations: input
			};
		}

		forward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var prob = this.probability,
			    act = ctx.activations;

			// if (ctx.state.options.learning !== true) {
			// 	for (var i = 0; i < X; i++)
			// 		outw[i] = inpw[i] * prob 

			// 	return 
			// }

			for (var i = 0; i < X; i++) {
				if (Math.random() < prob) {
					// dropping out
					outw[i] = 0.0;
					act[i] = 0.0;
				} else {
					outw[i] = inpw[i] / (1.0 - prob);
					act[i] = 1.0;
				}
			}
		}

		backward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw;
			var prob = this.probability,
			    act = ctx.activations;

			// if (ctx.state.options.learning !== true) {
			// 	// for (var i = 0; i < X; i++)
			// 	// 	inpdw[i] = outdw[i] * prob 

			// 	return
			// }

			for (var i = 0; i < X; i++) {
				inpdw[i] = act[i] * outdw[i] / (1.0 - prob);
			}
		}

	}

	module.exports = {
		DropOutLayer
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

	class NonLinearityLayer {

		constructor(input, opt) {
			this.dimensions = {
				input,
				output: input,
				parameters: 0
			};
		}

	}

	class SigmoidLayer extends NonLinearityLayer {

		forward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;

			for (var i = 0; i < X; i++) {
				outw[i] = 1 / (1 + Math.exp(-inpw[i]));
			}
		}

		backward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw;

			for (var i = 0; i < X; i++) {
				inpdw[i] = outw[i] * (1.0 - outw[i]) * outdw[i];
			}
		}

	}

	class TanhLayer extends NonLinearityLayer {

		forward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var y = 0.0;

			for (var i = 0; i < X; i++) {
				y = Math.exp(2 * inpw[i]);
				outw[i] = (y - 1) / (y + 1);
			}
		}

		backward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw;

			for (var i = 0; i < X; i++) {
				inpdw[i] = (1 - outw[i] * outw[i]) * outdw[i];
			}
		}

	}

	class ReLuLayer extends NonLinearityLayer {

		constructor(input, opt) {
			super(input, opt);
			this.leaky = opt.leaky || 0;
		}

		forward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var y = 0.0;

			for (var i = 0; i < X; i++) {
				outw[i] = inpw[i] > 0.0 ? inpw[i] : this.leaky * inpw[i];
			}
		}

		backward(ctx) {
			var X = this.dimensions.input.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw;

			for (var i = 0; i < X; i++) {
				inpdw[i] = inpw[i] > 0.0 ? outdw[i] : this.leaky * outdw[i];
			}
		}

	}

	module.exports = {
		SigmoidLayer, TanhLayer, ReLuLayer
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Size = __webpack_require__(4);

	class InputLayer {

		constructor(inp, opt) {
			this.dimensions = {
				input: Size.derive(opt.size),
				output: Size.derive(opt.size),
				parameters: 0
			};

			this.input = true;
			this.passthrough = true;
		}

		toInputVector(input, out) {
			if (input === undefined) return;

			if (Number.isInteger(input) && input < this.dimensions.intrinsic) {
				out.fill(0.0);
				out[input] = 1.0;
			} else if (input.length === out.length) {
				out.set(input);
			} else {
				throw 'invalid input format';
			}
		}

	}

	module.exports = {
		InputLayer
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";

	class OutputLayer {

	    constructor(inp, opt) {
	        this.dimensions = {
	            input: inp,
	            output: inp,
	            parameters: 0
	        };

	        this.output = true;
	    }

	    result(ctx) {
	        return ctx.output.w.clone();
	    }

	}

	class SoftmaxLayer extends OutputLayer {

	    forward(ctx) {
	        var X = this.dimensions.input.length;
	        var inpw = ctx.input.w,
	            outw = ctx.output.w;
	        var inpmax = -Infinity;

	        for (var i = 0; i < X; ++i) if (inpw[i] > inpmax) inpmax = inpw[i];

	        var expsum = 0.0;
	        for (var i = 0; i < X; ++i) expsum += outw[i] = Math.exp(inpw[i] - inpmax);

	        for (var i = 0; i < X; ++i) outw[i] /= expsum;
	    }

	    backward(ctx) {
	        var X = this.dimensions.input.length;
	        var inpdw = ctx.input.dw;
	        var outdw = ctx.output.dw,
	            outw = ctx.output.w;

	        for (var i = 0; i < X; i++) {
	            var sum = outw[i] * (1 - outw[i]) * outdw[i];

	            for (var j = 0; j < X; j++) {
	                if (i !== j) sum -= outw[j] * outw[i] * outdw[j];
	            }

	            inpdw[i] = sum;
	        }
	    }

	    loss(ctx, desired, target) {
	        return -Math.log(ctx.output.w[desired]);
	    }

	    toGradientVector(desired, actual, out) {
	        if (Number.isInteger(desired) !== true || desired >= this.size) throw 'target must be class index in softmax';

	        for (var i = 0; i < this.size; i++) {
	            out[i] = actual[i] - (desired === i ? 1.0 : 0.0);
	        }
	    }

	}

	class RegressionLayer extends OutputLayer {

	    constructor(inp, opt) {
	        super(inp, opt);
	        this.passthrough = true;
	    }

	    loss(ctx, desired) {
	        var loss = 0.0;
	        var grads = this.toGradientVector(desired, ctx.output.w);

	        for (var i = 0; i < this.dimensions.input.length; i++) {
	            loss += 0.5 * grads[i] * grads[i];
	        }

	        return loss;
	    }

	    toGradientVector(desired, actual, out) {
	        var X = this.dimensions.input.length;

	        if (out === undefined) {
	            out = new Float64Array(X);
	        }

	        // target is maximizing argmax, set n-th value to 1, rest to 0
	        if (X > 1 && !isNaN(desired) && Number.isInteger(desired) && desired < X) {
	            for (var i = 0; i < X; ++i) {
	                out[i] = actual[i] - (i === desired ? 1.0 : 0.0);
	            }
	        }

	        // single value output
	        else if (X === 1 && !isNaN(desired)) {
	                out[0] = actual[0] - desired;
	            } else if (desired instanceof Array || desired instanceof Float64Array) {
	                for (var i = 0; i < out.length; ++i) {
	                    out[i] = actual[i] - desired[i];
	                }
	            } else {
	                throw 'invalid target';
	            }

	        return out;
	    }

	}

	module.exports = {
	    RegressionLayer, SoftmaxLayer
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	
	"use strict";

	class UhlenbeckOrnsteinNoiseLayer {

		constructor(input, opt) {
			this.dimensions = {
				input,
				output: input,
				parameters: 0
			};

			this.theta = opt.theta || 0.15;
			this.sigma = opt.sigma || 0.3;
			this.delta = opt.delta || 0.1;

			this.storage = {
				noise: input
			};
		}

		forward(ctx) {
			var X = this.dimensions.input.length;
			var outw = ctx.output.w,
			    inpw = ctx.input.w;

			var alpha = 0.3;
			for (var i = 0; i < X; i++) {
				outw[i] = (1 - alpha) * inpw[i] + alpha * (ctx.noise[i] = Math.uhlenbeckOrnstein(ctx.noise[i], this.theta, this.sigma, this.delta));
			}
		}

		backward(ctx) {
			ctx.input.dw.set(ctx.output.dw);
		}

	}

	module.exports = {
		UhlenbeckOrnsteinNoiseLayer
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Size = __webpack_require__(4);

	// http://arxiv.org/pdf/1505.05424.pdf
	class VariationalBayesianLayer {

		constructor(input, opt) {
			opt.size = Size.derive(opt.size);

			this.dimensions = {
				input,
				output: opt.size,
				parameters: 2 * (input.length * opt.size.length + opt.size.length) // mean and std
			};

			this.storage = {
				sample: input.length * opt.size.length + opt.size.length,
				weights: input.length * opt.size.length + opt.size.length
			};
		}

		forward(ctx) {
			var sum = 0.0,
			    X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w,
			    paramw = ctx.params.w;
			var sampled = ctx.sample,
			    weights = ctx.weights,
			    epsilon = 0;
			var mu, std, w, b;

			if (ctx.state.options.uncertainty) {
				return this.uncertainty(ctx);
			}

			for (var i = 0; i < Y; i++) {
				sum = 0.0;
				for (var j = 0; j < X; j++) {
					mu = paramw[(i * X + j) * 2 + 0];
					std = Math.log(1 + Math.exp(paramw[(i * X + j) * 2 + 1]));

					sampled[i * X + j] = epsilon = Math.randn();
					weights[i * X + j] = w = mu + std * epsilon;

					sum += inpw[j] * w;
				}

				mu = paramw[(X * Y + i) * 2 + 0];
				std = Math.log(1 + Math.exp(paramw[(X * Y + i) * 2 + 1]));

				sampled[X * Y + i] = epsilon = Math.randn();
				weights[X * Y + i] = b = mu + std * epsilon;

				outw[i] = sum + b;
			}
		}

		uncertainty(ctx) {
			var sum = 0.0,
			    X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w,
			    paramw = ctx.params.w;
			var std,
			    mu,
			    w,
			    b,
			    dir = ctx.state.options.uncertainty;

			for (var i = 0; i < Y; i++) {
				sum = 0.0;
				for (var j = 0; j < X; j++) {
					mu = paramw[(i * X + j) * 2 + 0];
					std = Math.log(1 + Math.exp(paramw[(i * X + j) * 2 + 1]));
					w = mu + dir * std;

					sum += inpw[j] * w;
				}

				mu = paramw[(X * Y + i) * 2 + 0];
				std = Math.log(1 + Math.exp(paramw[(X * Y + i) * 2 + 1]));
				b = mu + dir * std;

				outw[i] = sum + b;
			}
		}

		backward(ctx) {
			var sum = 0.0,
			    X = this.dimensions.input.length,
			    Y = this.dimensions.output.length;
			var inpw = ctx.input.w,
			    outw = ctx.output.w,
			    paramw = ctx.params.w;
			var inpdw = ctx.input.dw,
			    outdw = ctx.output.dw,
			    paramdw = ctx.params.dw;
			var sampled = ctx.sample,
			    weights = ctx.weights;

			for (var i = 0; i < X; i++) {
				sum = 0.0;
				for (var j = 0; j < Y; j++) {
					paramdw[(j * X + i) * 2 + 0] = inpw[i] * outdw[j];
					paramdw[(j * X + i) * 2 + 1] = inpw[i] * outdw[j] * sampled[j * X + i] / (1.0 + Math.exp(-paramw[(j * X + i) * 2 + 1]));
					sum += weights[j * X + i] * outdw[j];
				}

				inpdw[i] = sum;
			}

			for (var i = 0; i < Y; i++) {
				paramdw[(X * Y + i) * 2 + 0] = outdw[i];
				paramdw[(X * Y + i) * 2 + 1] = outdw[i] * sampled[X * Y + i] / (1.0 + Math.exp(-paramw[(X * Y + i) * 2 + 1]));
			}
		}

		initialize(params) {
			var H = this.dimensions.parameters / 2;
			var elements = this.dimensions.input.length + this.dimensions.output.length;
			var scale = Math.sqrt(2.0 / elements);

			for (var i = 0; i < H; i += 2) {
				params.w[i] = Math.randn() * scale;
				params.w[i + 1] = Math.randn();
			}
		}

	}

	module.exports = {
		VariationalBayesianLayer
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var Size = __webpack_require__(4);

	module.exports = class Tensor {

		constructor(size) {
			this.size = Size.derive(size);
			this.w = new Float64Array(this.size.length);
			this.dw = new Float64Array(this.size.length);
		}

	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";

	Object.assign(RegExp, {

	    escape(str) {
	        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	    }

	});

	Object.assign(Function.prototype, {

	    getArguments() {
	        const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	        const ARGUMENT_NAMES = /([^\s,]+)/g;

	        if (this.$args) return this.$args;

	        var fnStr = this.toString().replace(STRIP_COMMENTS, '');
	        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	        if (result === null) result = [];

	        return this.$args = result;
	    },

	    getSource() {
	        return this.toString().replace(/^[^{]+{/i, '').replace(/}[^}]*$/i, '');
	    },

	    decompile() {
	        return { arguments: this.getArguments(), source: this.getSource() };
	    }

	});

	Object.assign(Object, {

	    each(obj, callback) {
	        for (var key in obj) if (obj.hasOwnProperty(key)) callback(key, obj[key]);
	    }

	});

	Object.assign(String.prototype, {

	    replaceAll(find, replace) {
	        return this.replace(new RegExp(RegExp.escape(find), 'g'), replace);
	    }

	});

	/**
	 * How to use this optimizer:
	 *
	 * 1. First initialize with options e.g.
	 *     var optimizer = new Optim({
	 *         method: 'adadelta',
	 *         regularization: { l2: 1e-2 },
	 *         clipping: 5
	 *     })
	 * 2. Then create a (weight) tensor:
	 *     var toOptimize = new Tensor(100)
	 * 3. And prepare the tensor for optimization
	 *     optimizer.initialize(toOptimize)
	 * 4. Then add a gradient to the tensor (not practical like this, but you get the hang of it)
	 *     toOptimize.dw[50] = 1.0
	 * 5. Accumulate gradient (do this n-times if n is your batch count)
	 *     optimizer.accumulate(toOptimize)
	 * 6. Finally apply gradient optimization via
	 *     optimizer.apply(toOptimize)
	 * 
	 */

	class Optim {

	    constructor(opt) {
	        this.update(opt || {});
	        this.uuid = ++Optim.INDEX;
	    }

	    update(opt) {
	        this.method = opt.method || 'sgd';
	        this.options = Object.assign({

	            type: 'descent',
	            clipping: 0,
	            regularization: {
	                l1: 0,
	                l2: 0
	            }

	        }, Optim.methods[this.method].options, opt);

	        delete this.options.method;

	        this.options = Object.freeze(this.options);

	        this.build();
	    }

	    build() {
	        if (this.options.type === 'descent') this.apply = this.assemble('-');else if (this.options.type === 'ascent') this.apply = this.assemble('+');else throw 'unrecognized optimizer type';
	    }

	    assemble(dir) {
	        var method = Optim.methods[this.method];
	        var regDir = dir === '+' ? '-' : '+';

	        var performer = (method.deliver ? method.deliver(this.options) : method.perform).decompile();
	        var stateDefs = [],
	            produceDefs = [];

	        this.states = performer.arguments;

	        for (var i = 0; i < this.states.length; i++) {
	            stateDefs.push(this.states[i] + '=' + 'dw.' + this.states[i]);
	        }

	        function _definitions() {
	            var defs = '';
	            if (stateDefs.length > 0) defs += 'var ' + stateDefs.join(',') + ';';

	            if (produceDefs.length > 0) defs += 'var ' + produceDefs.join(',') + ';';

	            return defs;
	        }

	        function _gradient() {
	            var producer = '';
	            if (this.options.clipping > 0) {
	                producer += 'grad = grad > opt.clipping ? opt.clipping : (grad < -opt.clipping ? -opt.clipping : grad);\n';
	            }

	            var sum = 'grad';
	            if (this.options.regularization.l1 > 0) {
	                produceDefs.push('l1grad');
	                producer += 'l1grad = opt.regularization.l1 * (w[i] > 0 ? ' + regDir + '1 : ' + dir + '1);\n';
	                sum += '+l1grad';
	            }

	            if (this.options.regularization.l2 > 0) {
	                produceDefs.push('l2grad');
	                producer += 'l2grad = opt.regularization.l2 * w[i] * ' + regDir + '1.0;\n';
	                sum += '+l2grad';
	            }

	            producer += 'gij = ' + '(' + sum + ') / iteration' + ';\n';

	            return { source: producer };
	        }

	        function replaceOptionsWithConstants(k, v) {
	            if (typeof v === 'object') {
	                Object.each(v, replaceOptionsWithConstants.bind(this + k + '.'));
	                return;
	            }

	            fn = fn.replaceAll(this + k, v);
	        }

	        var grad = _gradient.call(this);

	        var fn = `"use strict";
	            var w = tensor.w, dw = tensor.dw, accdw = dw.acc;
	            var dx, gij, grad, iteration = dw.iteration;
	            if (iteration < 1) return ;
	            ${ _definitions() }
	            for (var i = 0; i < w.length; ++i) {
	                grad = accdw[i];
	                ${ grad.source }
	                ${ performer.source }
	                w[i] ${ dir }= dx;
	                accdw[i] = 0.0;
	            }
	            dw.iteration = 0;`;

	        Object.each(this.options, replaceOptionsWithConstants.bind('opt.'));
	        return new Function('tensor', fn);
	    }

	    accumulate(tensor, weighted) {
	        weighted = weighted || 1;
	        var w = tensor.w,
	            dw = tensor.dw,
	            accdw = dw.acc;
	        var dx,
	            gij,
	            grad,
	            iteration = dw.iteration += weighted;
	        for (var i = 0; i < w.length; ++i) accdw[i] += weighted * dw[i];
	    }

	    initialize(tensor, set, linked) {
	        if (!tensor.initialized) {
	            // general initialization
	            tensor.dw.iteration = 0;
	            tensor.dw.acc = new Float64Array(tensor.dw.length);
	        }

	        for (var i = 0; i < this.states.length; ++i) {
	            // specific (algorithm dependent) initialization
	            if (this.states[i] in tensor.dw) tensor.dw[this.states[i]] = tensor.dw[this.states[i]].fill(0.0);else tensor.dw[this.states[i]] = new Float64Array(tensor.dw.length);
	        }

	        tensor.initialized = true;
	    }

	    static register(name, value) {
	        Optim.methods[name] = value;
	    }

	}

	Optim.methods = {};

	Optim.register("sgd", {

	    deliver(opt) {
	        if (opt.momentum === 0) {
	            return function () {
	                dx = opt.rate * gij;
	            };
	        }

	        return this.perform;
	    },

	    perform(mom) {
	        dx = opt.rate * gij + opt.momentum * mom[i];
	        mom[i] = dx;
	    },

	    options: {
	        rate: 0.01,
	        momentum: 0
	    }

	});

	Optim.register("adadelta", {

	    perform(gsum, xsum) {
	        gsum[i] = opt.ro * gsum[i] + (1 - opt.ro) * gij * gij;
	        dx = Math.sqrt((xsum[i] + opt.eps) / (gsum[i] + opt.eps)) * gij;
	        xsum[i] = opt.ro * xsum[i] + (1 - opt.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
	    },

	    options: {
	        ro: 0.95,
	        eps: 1e-8
	    }

	});

	Optim.register("adam", {

	    perform(m, v) {
	        m[i] = opt.beta1 * m[i] + (1 - opt.beta1) * gij; // update biased first moment estimate
	        v[i] = opt.beta2 * v[i] + (1 - opt.beta2) * gij * gij; // update biased second moment estimate
	        var bcm = m[i] / (1 - Math.pow(opt.beta1, iteration)); // correct bias first moment estimate
	        var bcv = v[i] / (1 - Math.pow(opt.beta2, iteration)); // correct bias second moment estimate
	        dx = opt.rate * bcm / (Math.sqrt(bcv) + opt.eps);
	    },

	    options: {
	        rate: 0.01,
	        eps: 1e-8,
	        beta1: 0.9,
	        beta2: 0.999
	    }

	});

	Optim.INDEX = 0;

	module.exports = Optim;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);
	module['exports'] = colors;

	// Remark: By default, colors will add style properties to String.prototype
	//
	// If you don't wish to extend String.prototype you can do this instead and native String will not be touched
	//
	//   var colors = require('colors/safe);
	//   colors.red("foo")
	//
	//
	__webpack_require__(22)();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {/*

	The MIT License (MIT)

	Original Library 
	  - Copyright (c) Marak Squires

	Additional functionality
	 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	*/

	var colors = {};
	module['exports'] = colors;

	colors.themes = {};

	var ansiStyles = colors.styles = __webpack_require__(16);
	var defineProps = Object.defineProperties;

	colors.supportsColor = __webpack_require__(17);

	if (typeof colors.enabled === "undefined") {
	  colors.enabled = colors.supportsColor;
	}

	colors.stripColors = colors.strip = function(str){
	  return ("" + str).replace(/\x1B\[\d+m/g, '');
	};


	var stylize = colors.stylize = function stylize (str, style) {
	  if (!colors.enabled) {
	    return str+'';
	  }

	  return ansiStyles[style].open + str + ansiStyles[style].close;
	}

	var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
	var escapeStringRegexp = function (str) {
	  if (typeof str !== 'string') {
	    throw new TypeError('Expected a string');
	  }
	  return str.replace(matchOperatorsRe,  '\\$&');
	}

	function build(_styles) {
	  var builder = function builder() {
	    return applyStyle.apply(builder, arguments);
	  };
	  builder._styles = _styles;
	  // __proto__ is used because we must return a function, but there is
	  // no way to create a function with a different prototype.
	  builder.__proto__ = proto;
	  return builder;
	}

	var styles = (function () {
	  var ret = {};
	  ansiStyles.grey = ansiStyles.gray;
	  Object.keys(ansiStyles).forEach(function (key) {
	    ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
	    ret[key] = {
	      get: function () {
	        return build(this._styles.concat(key));
	      }
	    };
	  });
	  return ret;
	})();

	var proto = defineProps(function colors() {}, styles);

	function applyStyle() {
	  var args = arguments;
	  var argsLen = args.length;
	  var str = argsLen !== 0 && String(arguments[0]);
	  if (argsLen > 1) {
	    for (var a = 1; a < argsLen; a++) {
	      str += ' ' + args[a];
	    }
	  }

	  if (!colors.enabled || !str) {
	    return str;
	  }

	  var nestedStyles = this._styles;

	  var i = nestedStyles.length;
	  while (i--) {
	    var code = ansiStyles[nestedStyles[i]];
	    str = code.open + str.replace(code.closeRe, code.open) + code.close;
	  }

	  return str;
	}

	function applyTheme (theme) {
	  for (var style in theme) {
	    (function(style){
	      colors[style] = function(str){
	        if (typeof theme[style] === 'object'){
	          var out = str;
	          for (var i in theme[style]){
	            out = colors[theme[style][i]](out);
	          }
	          return out;
	        }
	        return colors[theme[style]](str);
	      };
	    })(style)
	  }
	}

	colors.setTheme = function (theme) {
	  if (typeof theme === 'string') {
	    try {
	      colors.themes[theme] = __webpack_require__(19)(theme);
	      applyTheme(colors.themes[theme]);
	      return colors.themes[theme];
	    } catch (err) {
	      console.log(err);
	      return err;
	    }
	  } else {
	    applyTheme(theme);
	  }
	};

	function init() {
	  var ret = {};
	  Object.keys(styles).forEach(function (name) {
	    ret[name] = {
	      get: function () {
	        return build([name]);
	      }
	    };
	  });
	  return ret;
	}

	var sequencer = function sequencer (map, str) {
	  var exploded = str.split(""), i = 0;
	  exploded = exploded.map(map);
	  return exploded.join("");
	};

	// custom formatter methods
	colors.trap = __webpack_require__(20);
	colors.zalgo = __webpack_require__(21);

	// maps
	colors.maps = {};
	colors.maps.america = __webpack_require__(23);
	colors.maps.zebra = __webpack_require__(26);
	colors.maps.rainbow = __webpack_require__(24);
	colors.maps.random = __webpack_require__(25)

	for (var map in colors.maps) {
	  (function(map){
	    colors[map] = function (str) {
	      return sequencer(colors.maps[map], str);
	    }
	  })(map)
	}

	defineProps(colors, init());
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {/*
	The MIT License (MIT)

	Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	*/

	var styles = {};
	module['exports'] = styles;

	var codes = {
	  reset: [0, 0],

	  bold: [1, 22],
	  dim: [2, 22],
	  italic: [3, 23],
	  underline: [4, 24],
	  inverse: [7, 27],
	  hidden: [8, 28],
	  strikethrough: [9, 29],

	  black: [30, 39],
	  red: [31, 39],
	  green: [32, 39],
	  yellow: [33, 39],
	  blue: [34, 39],
	  magenta: [35, 39],
	  cyan: [36, 39],
	  white: [37, 39],
	  gray: [90, 39],
	  grey: [90, 39],

	  bgBlack: [40, 49],
	  bgRed: [41, 49],
	  bgGreen: [42, 49],
	  bgYellow: [43, 49],
	  bgBlue: [44, 49],
	  bgMagenta: [45, 49],
	  bgCyan: [46, 49],
	  bgWhite: [47, 49],

	  // legacy styles for colors pre v1.0.0
	  blackBG: [40, 49],
	  redBG: [41, 49],
	  greenBG: [42, 49],
	  yellowBG: [43, 49],
	  blueBG: [44, 49],
	  magentaBG: [45, 49],
	  cyanBG: [46, 49],
	  whiteBG: [47, 49]

	};

	Object.keys(codes).forEach(function (key) {
	  var val = codes[key];
	  var style = styles[key] = [];
	  style.open = '\u001b[' + val[0] + 'm';
	  style.close = '\u001b[' + val[1] + 'm';
	});
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {/*
	The MIT License (MIT)

	Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

	*/

	var argv = process.argv;

	module.exports = (function () {
	  if (argv.indexOf('--no-color') !== -1 ||
	    argv.indexOf('--color=false') !== -1) {
	    return false;
	  }

	  if (argv.indexOf('--color') !== -1 ||
	    argv.indexOf('--color=true') !== -1 ||
	    argv.indexOf('--color=always') !== -1) {
	    return true;
	  }

	  if (process.stdout && !process.stdout.isTTY) {
	    return false;
	  }

	  if (process.platform === 'win32') {
	    return true;
	  }

	  if ('COLORTERM' in process.env) {
	    return true;
	  }

	  if (process.env.TERM === 'dumb') {
	    return false;
	  }

	  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
	    return true;
	  }

	  return false;
	})();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(18)))

/***/ },
/* 18 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	(function () {
	    try {
	        cachedSetTimeout = setTimeout;
	    } catch (e) {
	        cachedSetTimeout = function () {
	            throw new Error('setTimeout is not defined');
	        }
	    }
	    try {
	        cachedClearTimeout = clearTimeout;
	    } catch (e) {
	        cachedClearTimeout = function () {
	            throw new Error('clearTimeout is not defined');
	        }
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./colors": 15,
		"./colors.js": 15,
		"./custom/trap": 20,
		"./custom/trap.js": 20,
		"./custom/zalgo": 21,
		"./custom/zalgo.js": 21,
		"./extendStringPrototype": 22,
		"./extendStringPrototype.js": 22,
		"./index": 13,
		"./index.js": 13,
		"./maps/america": 23,
		"./maps/america.js": 23,
		"./maps/rainbow": 24,
		"./maps/rainbow.js": 24,
		"./maps/random": 25,
		"./maps/random.js": 25,
		"./maps/zebra": 26,
		"./maps/zebra.js": 26,
		"./styles": 16,
		"./styles.js": 16,
		"./system/supports-colors": 17,
		"./system/supports-colors.js": 17
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 19;


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {module['exports'] = function runTheTrap (text, options) {
	  var result = "";
	  text = text || "Run the trap, drop the bass";
	  text = text.split('');
	  var trap = {
	    a: ["\u0040", "\u0104", "\u023a", "\u0245", "\u0394", "\u039b", "\u0414"],
	    b: ["\u00df", "\u0181", "\u0243", "\u026e", "\u03b2", "\u0e3f"],
	    c: ["\u00a9", "\u023b", "\u03fe"],
	    d: ["\u00d0", "\u018a", "\u0500" , "\u0501" ,"\u0502", "\u0503"],
	    e: ["\u00cb", "\u0115", "\u018e", "\u0258", "\u03a3", "\u03be", "\u04bc", "\u0a6c"],
	    f: ["\u04fa"],
	    g: ["\u0262"],
	    h: ["\u0126", "\u0195", "\u04a2", "\u04ba", "\u04c7", "\u050a"],
	    i: ["\u0f0f"],
	    j: ["\u0134"],
	    k: ["\u0138", "\u04a0", "\u04c3", "\u051e"],
	    l: ["\u0139"],
	    m: ["\u028d", "\u04cd", "\u04ce", "\u0520", "\u0521", "\u0d69"],
	    n: ["\u00d1", "\u014b", "\u019d", "\u0376", "\u03a0", "\u048a"],
	    o: ["\u00d8", "\u00f5", "\u00f8", "\u01fe", "\u0298", "\u047a", "\u05dd", "\u06dd", "\u0e4f"],
	    p: ["\u01f7", "\u048e"],
	    q: ["\u09cd"],
	    r: ["\u00ae", "\u01a6", "\u0210", "\u024c", "\u0280", "\u042f"],
	    s: ["\u00a7", "\u03de", "\u03df", "\u03e8"],
	    t: ["\u0141", "\u0166", "\u0373"],
	    u: ["\u01b1", "\u054d"],
	    v: ["\u05d8"],
	    w: ["\u0428", "\u0460", "\u047c", "\u0d70"],
	    x: ["\u04b2", "\u04fe", "\u04fc", "\u04fd"],
	    y: ["\u00a5", "\u04b0", "\u04cb"],
	    z: ["\u01b5", "\u0240"]
	  }
	  text.forEach(function(c){
	    c = c.toLowerCase();
	    var chars = trap[c] || [" "];
	    var rand = Math.floor(Math.random() * chars.length);
	    if (typeof trap[c] !== "undefined") {
	      result += trap[c][rand];
	    } else {
	      result += c;
	    }
	  });
	  return result;

	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {// please no
	module['exports'] = function zalgo(text, options) {
	  text = text || "   he is here   ";
	  var soul = {
	    "up" : [
	      '̍', '̎', '̄', '̅',
	      '̿', '̑', '̆', '̐',
	      '͒', '͗', '͑', '̇',
	      '̈', '̊', '͂', '̓',
	      '̈', '͊', '͋', '͌',
	      '̃', '̂', '̌', '͐',
	      '̀', '́', '̋', '̏',
	      '̒', '̓', '̔', '̽',
	      '̉', 'ͣ', 'ͤ', 'ͥ',
	      'ͦ', 'ͧ', 'ͨ', 'ͩ',
	      'ͪ', 'ͫ', 'ͬ', 'ͭ',
	      'ͮ', 'ͯ', '̾', '͛',
	      '͆', '̚'
	    ],
	    "down" : [
	      '̖', '̗', '̘', '̙',
	      '̜', '̝', '̞', '̟',
	      '̠', '̤', '̥', '̦',
	      '̩', '̪', '̫', '̬',
	      '̭', '̮', '̯', '̰',
	      '̱', '̲', '̳', '̹',
	      '̺', '̻', '̼', 'ͅ',
	      '͇', '͈', '͉', '͍',
	      '͎', '͓', '͔', '͕',
	      '͖', '͙', '͚', '̣'
	    ],
	    "mid" : [
	      '̕', '̛', '̀', '́',
	      '͘', '̡', '̢', '̧',
	      '̨', '̴', '̵', '̶',
	      '͜', '͝', '͞',
	      '͟', '͠', '͢', '̸',
	      '̷', '͡', ' ҉'
	    ]
	  },
	  all = [].concat(soul.up, soul.down, soul.mid),
	  zalgo = {};

	  function randomNumber(range) {
	    var r = Math.floor(Math.random() * range);
	    return r;
	  }

	  function is_char(character) {
	    var bool = false;
	    all.filter(function (i) {
	      bool = (i === character);
	    });
	    return bool;
	  }
	  

	  function heComes(text, options) {
	    var result = '', counts, l;
	    options = options || {};
	    options["up"] =   typeof options["up"]   !== 'undefined' ? options["up"]   : true;
	    options["mid"] =  typeof options["mid"]  !== 'undefined' ? options["mid"]  : true;
	    options["down"] = typeof options["down"] !== 'undefined' ? options["down"] : true;
	    options["size"] = typeof options["size"] !== 'undefined' ? options["size"] : "maxi";
	    text = text.split('');
	    for (l in text) {
	      if (is_char(l)) {
	        continue;
	      }
	      result = result + text[l];
	      counts = {"up" : 0, "down" : 0, "mid" : 0};
	      switch (options.size) {
	      case 'mini':
	        counts.up = randomNumber(8);
	        counts.mid = randomNumber(2);
	        counts.down = randomNumber(8);
	        break;
	      case 'maxi':
	        counts.up = randomNumber(16) + 3;
	        counts.mid = randomNumber(4) + 1;
	        counts.down = randomNumber(64) + 3;
	        break;
	      default:
	        counts.up = randomNumber(8) + 1;
	        counts.mid = randomNumber(6) / 2;
	        counts.down = randomNumber(8) + 1;
	        break;
	      }

	      var arr = ["up", "mid", "down"];
	      for (var d in arr) {
	        var index = arr[d];
	        for (var i = 0 ; i <= counts[index]; i++) {
	          if (options[index]) {
	            result = result + soul[index][randomNumber(soul[index].length)];
	          }
	        }
	      }
	    }
	    return result;
	  }
	  // don't summon him
	  return heComes(text, options);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);

	module['exports'] = function () {

	  //
	  // Extends prototype of native string object to allow for "foo".red syntax
	  //
	  var addProperty = function (color, func) {
	    String.prototype.__defineGetter__(color, func);
	  };

	  var sequencer = function sequencer (map, str) {
	      return function () {
	        var exploded = this.split(""), i = 0;
	        exploded = exploded.map(map);
	        return exploded.join("");
	      }
	  };

	  addProperty('strip', function () {
	    return colors.strip(this);
	  });

	  addProperty('stripColors', function () {
	    return colors.strip(this);
	  });

	  addProperty("trap", function(){
	    return colors.trap(this);
	  });

	  addProperty("zalgo", function(){
	    return colors.zalgo(this);
	  });

	  addProperty("zebra", function(){
	    return colors.zebra(this);
	  });

	  addProperty("rainbow", function(){
	    return colors.rainbow(this);
	  });

	  addProperty("random", function(){
	    return colors.random(this);
	  });

	  addProperty("america", function(){
	    return colors.america(this);
	  });

	  //
	  // Iterate through all default styles and colors
	  //
	  var x = Object.keys(colors.styles);
	  x.forEach(function (style) {
	    addProperty(style, function () {
	      return colors.stylize(this, style);
	    });
	  });

	  function applyTheme(theme) {
	    //
	    // Remark: This is a list of methods that exist
	    // on String that you should not overwrite.
	    //
	    var stringPrototypeBlacklist = [
	      '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'charAt', 'constructor',
	      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf', 'charCodeAt',
	      'indexOf', 'lastIndexof', 'length', 'localeCompare', 'match', 'replace', 'search', 'slice', 'split', 'substring',
	      'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight'
	    ];

	    Object.keys(theme).forEach(function (prop) {
	      if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
	        console.log('warn: '.red + ('String.prototype' + prop).magenta + ' is probably something you don\'t want to override. Ignoring style name');
	      }
	      else {
	        if (typeof(theme[prop]) === 'string') {
	          colors[prop] = colors[theme[prop]];
	          addProperty(prop, function () {
	            return colors[theme[prop]](this);
	          });
	        }
	        else {
	          addProperty(prop, function () {
	            var ret = this;
	            for (var t = 0; t < theme[prop].length; t++) {
	              ret = colors[theme[prop][t]](ret);
	            }
	            return ret;
	          });
	        }
	      }
	    });
	  }

	  colors.setTheme = function (theme) {
	    if (typeof theme === 'string') {
	      try {
	        colors.themes[theme] = __webpack_require__(19)(theme);
	        applyTheme(colors.themes[theme]);
	        return colors.themes[theme];
	      } catch (err) {
	        console.log(err);
	        return err;
	      }
	    } else {
	      applyTheme(theme);
	    }
	  };

	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);

	module['exports'] = (function() {
	  return function (letter, i, exploded) {
	    if(letter === " ") return letter;
	    switch(i%3) {
	      case 0: return colors.red(letter);
	      case 1: return colors.white(letter)
	      case 2: return colors.blue(letter)
	    }
	  }
	})();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);

	module['exports'] = (function () {
	  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
	  return function (letter, i, exploded) {
	    if (letter === " ") {
	      return letter;
	    } else {
	      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
	    }
	  };
	})();


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);

	module['exports'] = (function () {
	  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
	  return function(letter, i, exploded) {
	    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
	  };
	})();
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {var colors = __webpack_require__(15);

	module['exports'] = function (letter, i, exploded) {
	  return i % 2 === 0 ? letter : colors.inverse(letter);
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(14)(module)))

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	// var network = require('../network.js')
	var Window = __webpack_require__(28);
	var Experience = __webpack_require__(29);
	var Buffers = __webpack_require__(30);
	var DQN = __webpack_require__(31);
	var DDPG = __webpack_require__(32);

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

				beta: 0.5 }, opt);

			// options
			this.states = this.options.states; // state space
			this.actions = this.options.actions; // action space
			this.input = this.states + this.options.temporalWindow * (this.states + this.actions); // extended state (over time)

			// settings
			this.buffer = new this.options.buffer(this.options.experience);
			this.history = {
				states: new Window(Math.max(2, this.options.temporalWindow)),
				actions: new Window(Math.max(2, this.options.temporalWindow)),
				inputs: new Window(2),
				rewards: new Window(2)
			};

			this.age = 1;
			this.learning = true;
			this.ready = true;

			switch (this.options.algorithm) {
				case 'dqn':
					this.algorithm = new DQN(this);break;
				case 'ddpg':
					this.algorithm = new DDPG(this);break;
				default:
					throw 'unknown algorithm';
			}
		}

		/**
	  * Let the agent make an action, includes exploration through noise
	  * @param  {Array} state
	  * @return {Array}       An action
	  */
		policy(state) {
			if (!this.ready) return;

			var input = this.getStateInputVector(state);
			var action = this.act(input);

			this.history.inputs.push(input);
			this.history.states.push(state);
			this.history.actions.push(action);
			this.acted = true;

			return action;
		}

		actionToVector(action) {
			if (action instanceof Float64Array) return action;

			if (Number.isInteger(action)) return Float64Array.oneHot(action, this.actions);

			throw 'action invalid';
		}

		getStateInputVector(state) {
			if (this.options.temporalWindow > 0) {
				var input = new Float64Array(this.input);
				var cursor = 0;

				for (var t = this.options.temporalWindow - 1; t >= 0; t--) {
					if (this.history.states.size > t) {
						input.set(this.history.states.get(t), cursor);
						input.set(this.actionToVector(this.history.actions.get(t)), cursor + this.states);
					}

					cursor += this.states + this.actions;
				}

				input.set(state, cursor);

				return input;
			}

			return state;
		}

		/**
	  * Simulate that the agent did an action
	  * @param  {Array} state
	  * @param  {Array} action
	  */
		simulate(state, action) {
			if (!this.ready) return;

			var input = this.getStateInputVector(state);

			this.history.inputs.push(input);
			this.history.states.push(state);
			this.history.actions.push(action);
			this.acted = true;
		}

		/**
	  * Adds an experience to the buffer and replays an batch of experiences
	  * @param  {Float} reward
	  * @return {Float}        The loss
	  */
		learn(reward) {
			if (!this.acted || !this.ready) return;

			this.acted = false;
			this.history.rewards.push(reward);

			// Learning happens always one step after actually experiencing
			if (this.history.states.size < 2) return;

			if (this.learning === false) return;

			// Create new experience
			var e = new Experience(this);
			e.action0 = this.history.actions.get(1);
			e.state0 = this.history.inputs.get(1);
			e.reward0 = this.history.rewards.get(1);
			e.state1 = this.history.inputs.get(0);
			e.action1 = this.history.actions.get(0); // for SARSA only
			e.init(); // set loss etc.

			// Add experience to replay buffer
			this.buffer.add(e);

			// Get older
			++this.age;

			// Learn batch
			var loss = this.replay();

			// Execute algorithm
			this.algorithm.learn(e);

			return loss;
		}

		replay() {
			var batch = this.buffer.sample(this.options.learningPerTick),
			    loss = 0.0;

			for (var i = 0; i < batch.length; i++) {
				loss += batch[i].step();
			}

			this.buffer.updateAfterLearning(batch);

			return loss / batch.length;
		}

		// 
		act(state, target) {
			return this.algorithm.act(state, target);
		}

		value(state, action, target) {
			return this.algorithm.value(state, action, target);
		}

		evaluate(state, target) {
			return this.value(state, this.act(state, target), target);
		}

		// utility functions
		export() {
			return this.algorithm.export();
		}

		import(params) {
			this.algorithm.import(params);
		}

	}

	module.exports = Agent;

/***/ },
/* 28 */
/***/ function(module, exports) {

	class Window {

		constructor(n) {
			this.list = [];
			this.length = n;
		}

		push(value) {
			this.list.unshift(value);

			if (this.list.length > this.length) {
				this.list.pop();
			}
		}

		get(nth) {
			return this.list[nth];
		}

		get size() {
			return this.list.length;
		}

	}

	module.exports = Window;

/***/ },
/* 29 */
/***/ function(module, exports) {

	class Experience {

		constructor(agent) {
			this.agent = agent;
			this.learnSteps = 0;

			if (agent.options.type === 'sarsa') this.target = this.__sarsa_target;else this.target = this.__q_target;
		}

		__q_target() {
			return this.reward0 + this.agent.options.discount * this.agent.evaluate(this.state1, true); // this.agent.value(this.state1, this.agent.act(this.state1, true), true)
		}

		__sarsa_target() {
			return this.reward0 + this.agent.options.discount * this.agent.value(this.state1, this.action1, true);
		}

		estimate() {
			return this.value = this.agent.value(this.state0, this.action0);
		}

		step() {
			this.loss = this.agent.algorithm.optimize(this);

			this.learnSteps++;
			this.lastLearnedAt = this.agent.age;

			return this.loss;
		}

		init() {
			this.loss = this.agent.algorithm.optimize(this, false);
			this.atAge = this.agent.age;
		}

		get priority() {
			if (this.loss === undefined) return undefined;

			return Math.pow(this.loss, this.agent.options.beta || 0.5);
		}

	}

	module.exports = Experience;

/***/ },
/* 30 */
/***/ function(module, exports) {

	class ReplayBuffer {

		add(e) {
			throw 'not implemented';
		}
		sample(n) {
			throw 'not implemented';
		}
		getAverageLoss() {
			throw 'not implemented';
		}
		getImportanceSamplingWeight(e) {
			return 1.0;
		}
		updateAfterLearning() {}

	}

	class UniformReplayBuffer extends ReplayBuffer {

		constructor(size) {
			super();
			this.buffer = [];
			this.size = size;
		}

		add(e) {

			if (this.buffer.length >= this.size) {
				this.buffer[Math.randi(0, this.buffer.length)] = e;
			} else {
				this.buffer.push(e);
			}
		}

		sample(n) {
			var batch = [];

			if (this.buffer.length <= n) return this.buffer;

			for (var i = 0; i < n; i++) {
				batch.push(Array.random(this.buffer));
			}

			return batch;
		}

		draw() {
			return Array.random(this.buffer);
		}

		getAverageLoss() {
			return Array.sum(this.buffer, x => x.loss) / this.buffer.length;
		}

	}

	class PrioritizedReplayBuffer extends ReplayBuffer {

		constructor(N) {
			super();

			this.root = new PrioritizedReplayBuffer.Node(null, null);
			this.iterations = 0;
			this.size = 0;

			this.maxISW = 1.0;
			this.beta = 0.5;

			for (var i = 0; i < N - 1; ++i) {
				this.root.add(null);
			}

			this.leafs = this.root.getLeafs();

			if (this.leafs.length !== this.root.size) throw 'could not create replay tree...';
		}

		add(e) {
			this.leafs[this.iterations % this.leafs.length].set(e);
			this.size = Math.max(this.size, this.iterations % this.leafs.length + 1);
			this.iterations += 1;
		}

		sample(n) {
			var batch = [];

			this.maxISW = Math.pow(this.size * (this.root.minimum / this.root.value), -this.beta);

			if (this.size < 5 * n) return [];

			while (batch.length < n) batch.push(this.root.cumulativeSample(Math.random() * this.root.value).experience);

			return batch;
		}

		draw(prioritised) {
			if (!prioritised) return this.leafs[Math.randi(0, this.size)].experience;

			return this.root.cumulativeSample(Math.random() * this.root.value).experience;
		}

		updateAfterLearning(batch) {
			for (var i = 0; i < batch.length; i++) {
				var e = batch[i];
				if (e !== e.node.experience) throw 'association error';

				e.node.revalue();
			}
		}

		getImportanceSamplingWeight(e) {
			if (e.priority === undefined) return 1.0;

			return Math.pow(this.size * (e.priority / this.root.value), -this.beta);
		}

		getAverageLoss() {
			return this.root.value / this.root.size;
		}

	}

	PrioritizedReplayBuffer.Node = class Node {

		constructor(parent, experience) {
			this.parent = parent;
			this.children = [];
			this.size = 1;
			this.value = 0.0;

			this.maximum = -Infinity;
			this.minimum = Infinity;

			this.experience = experience;
			this.revalue();
		}

		cumulativeSample(x) {
			if (this.children.length === 0) return this;

			if (this.children[0].value < x) return this.children[1].cumulativeSample(x - this.children[0].value);else return this.children[0].cumulativeSample(x);
		}

		update() {
			this.value = Array.sum(this.children, x => x.value);
			this.maximum = this.children.reduce((a, b) => a.maximum > b.maximum ? a : b).maximum;
			this.minimum = this.children.reduce((a, b) => a.minimum < b.minimum ? a : b).minimum;

			if (this.parent) this.parent.update();
		}

		revalue() {
			if (this.children.length > 0) throw 'not possible';

			if (!this.experience) return;

			this.value = this.experience.priority || 0.0;

			this.maximum = this.value;
			this.minimum = this.value;

			if (this.parent) this.parent.update();
		}

		set(experience) {
			if (this.children.length > 0) throw "can't set experience of node with children";

			experience.node = this;

			this.experience = experience;
			this.revalue();
		}

		add(experience) {
			if (this.children.length === 0) {
				// branch off
				this.children.push(new PrioritizedReplayBuffer.Node(this, this.experience));
				this.children.push(new PrioritizedReplayBuffer.Node(this, experience));
				this.experience = null;

				// this.update()
			} else {
				this.children.reduce((a, b) => a.size < b.size ? a : b).add(experience);
			}

			this.size++;
		}

		descent(dir) {
			if (this.children.length === 0) return this;

			return this.children[dir(this.children[0], this.children[1])].descent(dir);
		}

		getLeafs() {
			if (this.children.length === 0) return [this];

			var unfolded = [];
			for (var i = 0; i < this.children.length; i++) {
				unfolded.push(this.children[i].getLeafs());
			}

			return Array.prototype.concat.apply([], unfolded);
		}

	};

	module.exports = {

		ReplayBuffer,
		UniformReplayBuffer,
		PrioritizedReplayBuffer

	};

/***/ },
/* 31 */
/***/ function(module, exports) {

	

	class DQN {

		constructor(agent) {
			// options
			this.options = Object.assign({

				alpha: 0.1, // advantage learning (AL) http://arxiv.org/pdf/1512.04860v1.pdf; increase action-gap
				theta: 0.001, // soft target updates

				learningSteps: 100e3,
				learningStepsBurnin: 3e3,

				epsilonMin: 0.05,
				epsilonAtTestTime: 0.05

			}, agent.options);

			//
			this.net = agent.options.network.newState();
			this.target = this.net.model.newState(); // agent.options.target.actor.newState()
			// this.target.configuration.copyParametersFrom(this.net.configuration)

			//
			this.targetWeightCopy = this.progressiveCopy.bind(this, this.net.configuration);

			this.net.configuration.useOptimizer({
				type: 'descent',
				method: 'adadelta',
				regularization: { l2: 1e-3 }
			});

			// agent
			this.agent = agent;
			this.buffer = agent.buffer;

			this.states = this.agent.states;
			this.actions = this.agent.actions;
			this.input = this.agent.input;
		}

		// what to do?
		act(state, target) {

			if (this.agent.learning) this.epsilon = Math.max(1.0 - Math.max((this.agent.age - this.options.learningStepsBurnin) / this.options.learningSteps, 0.0), this.options.epsilonMin);else this.epsilon = this.options.epsilonAtTestTime;

			if (Math.random() <= this.epsilon) {
				return Math.randi(0, this.actions);
			}

			this.net.forward(state);

			return this.net.out.w.maxi();
		}

		// how good is an action at state
		value(state, action, target) {
			target = target == null ? this.net : this.target;
			target.forward(state);
			return target.out.w[action];
		}

		// replay
		optimize(e, descent = true) {
			var target = e.target();
			var value = e.estimate();

			var grad = value - target;
			var gradAL = grad + this.options.alpha * (value - this.agent.evaluate(e.state0, true)); // advantage learning
			var isw = this.buffer.getImportanceSamplingWeight(e);

			this.net.out.dw.fill(0.0);
			this.net.out.dw[e.action0] = gradAL * isw;

			if (descent) {
				this.net.backward();
				this.net.configuration.accumulate();
			}

			return gradAL * gradAL * 0.5;
		}

		// adjust weights etc
		learn(e) {
			this.net.configuration.optimize(false);
			this.targetUpdate();
		}

		targetUpdate() {
			if (this.options.theta < 1) {
				this.target.configuration.forEachParameter(this.targetWeightCopy);
			}
		}

		progressiveCopy(net, param, index) {
			var _theta = this.options.theta;
			for (var i = 0; i < param.w.length; i++) {
				param.w[i] = _theta * net.parameters[index].w[i] + (1.0 - _theta) * param.w[i];
			}
		}

		import(params) {
			this.net.configuration.read(params);
		}

		export() {
			return this.net.configuration.write();
		}

	}

	module.exports = DQN;

/***/ },
/* 32 */
/***/ function(module, exports) {

	
	class DDPG {

		constructor(agent) {
			// options
			this.options = Object.assign({

				alpha: 0.1, // advantage learning (AL) http://arxiv.org/pdf/1512.04860v1.pdf; increase action-gap
				theta: 0.001 }, agent.options);

			// networks
			this.actor = agent.options.actor.newState();
			this.critic = agent.options.critic.newState();

			// target networks
			this.targetActor = this.actor.model.newState(); // agent.options.target.actor.newState()
			this.targetCritic = this.critic.model.newState(); // agent.options.target.critic.newState()

			this.targetActor.configuration.copyParametersFrom(this.actor.configuration);
			this.targetCritic.configuration.copyParametersFrom(this.critic.configuration);

			// network weight updates
			this.targetActorUpdate = this.progressiveCopy.bind(this, this.actor.configuration);
			this.targetCriticUpdate = this.progressiveCopy.bind(this, this.critic.configuration);

			// optimizer
			this.actor.configuration.useOptimizer({
				type: 'ascent',
				method: 'adadelta',
				regularization: { l2: 1e-3 }
			});

			this.critic.configuration.useOptimizer({
				type: 'descent',
				method: 'adadelta',
				regularization: { l2: 1e-3 }
			});

			// agent
			this.agent = agent;
			this.buffer = agent.buffer;

			this.states = this.agent.states;
			this.actions = this.agent.actions;
			this.input = this.agent.input;

			if (this.actor.in.w.length !== this.agent.input) throw 'actor input length insufficient';

			if (this.critic.in.w.length !== this.agent.input + this.agent.actions) throw 'critic input length insufficient';
		}

		act(state, target) {
			if (target) {
				return this.targetActor.forward(state);
			}

			return this.actor.forward(state);
		}

		value(state, action, target) {
			target = target ? this.targetCritic : this.critic;

			target.in.w.set(state, 0);
			target.in.w.set(action, this.input);

			return target.forward()[0];
		}

		optimize(e, descent = true) {
			var target = e.target();
			var value = e.estimate();

			var grad = value - target;
			var gradAL = grad + this.options.alpha * (value - this.agent.evaluate(e.state0, true)); // advantage learning
			var isw = this.buffer.getImportanceSamplingWeight(e);

			if (descent) {
				this.critic.backwardWithGradient(gradAL * isw);
				this.critic.configuration.accumulate();
				this.teach(e, isw);
			}

			return 0.5 * gradAL * gradAL; // Math.pow(this.teach(e, isw, descent) - target, 2)
		}

		teach(e, isw = 1.0, descent = true) {
			var action = this.actor.forward(e.state0); // which action to take?
			var val = this.value(e.state0, action); // how good will the future be, if i take this action?
			var grad = this.critic.derivatives(0, false); // how will the future change, if i change this action

			for (var i = 0; i < this.options.actions; i++) {
				this.actor.out.dw[i] = grad[this.input + i] * isw;
			}

			if (descent) {
				this.actor.backward(); // propagate change
				this.actor.configuration.accumulate();
			}
		}

		learn(e) {
			// Improve through batch accumuluated gradients
			this.actor.configuration.optimize(false);
			this.critic.configuration.optimize(false);

			// Copy actor and critic to target networks slowly
			this.targetNetworkUpdates();
		}

		targetNetworkUpdates() {
			if (this.options.theta < 1) {
				this.targetCritic.configuration.forEachParameter(this.targetCriticUpdate);
				this.targetActor.configuration.forEachParameter(this.targetActorUpdate);
			}
		}

		progressiveCopy(net, param, index) {
			var _theta = this.options.theta;
			for (var i = 0; i < param.w.length; i++) {
				param.w[i] = _theta * net.parameters[index].w[i] + (1.0 - _theta) * param.w[i];
			}
		}

		import(params) {
			var a_count = this.actor.configuration.countOfParameters;
			var c_count = this.critic.configuration.countOfParameters;

			var actor = params.subarray(0, a_count);
			var critic = params.subarray(a_count, a_count + c_count);

			this.actor.configuration.read(actor);
			this.critic.configuration.read(critic);

			this.targetActor.configuration.read(actor);
			this.targetCritic.configuration.read(critic);
		}

		export() {
			var a_count = this.actor.configuration.countOfParameters;
			var c_count = this.critic.configuration.countOfParameters;

			var params = new Float64Array(a_count + c_count);

			params.set(this.actor.configuration.write(), 0);
			params.set(this.critic.configuration.write(), a_count);

			return params;
		}

	}

	module.exports = DDPG;

/***/ },
/* 33 */
/***/ function(module, exports) {

	class WebLoader {

	    static load(path, completion) {
	        var request = new XMLHttpRequest();
	        request.open("GET", path, true);
	        request.responseType = "arraybuffer";
	        request.addEventListener('load', function (e) {
	            completion(request.response);
	        });

	        request.send(null);
	    }

	    static loadConfig(path, model, completion) {
	        var config = model.newConfiguration();
	        WebLoader.loadConfigInto(path, config, completion.bind(null, config));
	    }

	    static loadConfigInto(path, config, completion) {
	        WebLoader.load(path, function (buffer) {
	            var weights = new Float64Array(buffer);
	            config.read(weights);
	            completion();
	        });
	    }

	    static loadAgent(path, agent, completion) {
	        agent.ready = false;

	        WebLoader.load(path, function (buffer) {
	            var weights = new Float64Array(buffer);
	            agent.import(weights);
	            agent.ready = true;

	            if (completion) completion(agent);
	        });
	    }

	}

	module.exports = WebLoader;

/***/ }
/******/ ]);