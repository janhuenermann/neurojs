
"use strict";

class UhlenbeckOrnsteinNoiseLayer {

	constructor(input, opt) {
		this.dimensions = {
			input,
			output: input,
			parameters: 0
		}

		this.theta = opt.theta || 0.15
		this.sigma = opt.sigma || 0.3
		this.delta = opt.delta || 0.1

		this.storage = {
			noise: input
		}
	}

	forward(ctx) {
		var X = this.dimensions.input.length
		var outw = ctx.output.w, inpw = ctx.input.w

		var alpha = 0.3
		for (var i = 0; i < X; i++) {
			outw[i] = (1-alpha) * inpw[i] + alpha * (ctx.noise[i] = Math.uhlenbeckOrnstein(ctx.noise[i], this.theta, this.sigma, this.delta))
		}
	}

	backward(ctx) {
		ctx.input.dw.set(ctx.output.dw)
	}

}

module.exports = {
    UhlenbeckOrnsteinNoiseLayer
};
