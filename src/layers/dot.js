"use strict";

var Size = require('../math/size.js');

class FullyConnectedLayer {

	constructor(input, opt) {
		opt.size = Size.derive(opt.size)

		this.dimensions = {
			input,
			output: opt.size,
			parameters: input.length * opt.size.length + opt.size.length
		}
		
	}

	forward(ctx) {
		var sum = 0.0, X = this.dimensions.input.length, Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w, paramw = ctx.params.w
		

		for (var i = 0; i < Y; i++) {
			sum = 0.0
			for (var j = 0; j < X; j++) {
				sum += inpw[j] * paramw[i * X + j]
			}

			outw[i] = sum + paramw[X * Y + i]
		}

		// outw.set(this.fwd(inpw, paramw));
	}

	backward(ctx) {
		var sum = 0.0, X = this.dimensions.input.length, Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w, paramw = ctx.params.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw, paramdw = ctx.params.dw

		for (var i = 0; i < X; i++) {
			sum = 0.0
			for (var j = 0; j < Y; j++) {
				sum += paramw[j * X + i] * outdw[j]
				paramdw[j * X + i] = inpw[i] * outdw[j]
			}

			inpdw[i] = sum
		}

		for (var i = 0; i < Y; i++) {
			paramdw[X * Y + i] = outdw[i]
		}
	}

	initialize(params) {
		var X = this.dimensions.input.length, Y = this.dimensions.output.length

		if (this.options.init) {
            if (typeof this.options.init === 'number') 
			    params.w.randn(0.0, this.options.init)
            else if (this.options.init instanceof Array) 
                params.w.randf(this.options.init[0], this.options.init[1])
		}

		else {
			// var dropout = this.options.dropout || 0
			// var elements = (1 - dropout) * (this.dimensions.input.length + this.dimensions.output.length)
			var scale = Math.sqrt(1.0 / X)
			params.w.randn((this.options.mean / X) || 0.0, scale)
		}

		// biases should be zero
		for (var i = 0; i < Y; i++) {
			params.w[X * Y + i] = 0.0
		}
	}

}

module.exports = {
	FullyConnectedLayer
}