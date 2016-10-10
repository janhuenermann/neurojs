"use strict";

var Size = require('../math/size.js');

// http://arxiv.org/pdf/1505.05424.pdf
class VariationalBayesianLayer {

	constructor(input, opt) {
		opt.size = Size.derive(opt.size)

		this.dimensions = {
			input,
			output: opt.size,
			parameters: 2 * (input.length * opt.size.length + opt.size.length) // mean and std
		}

		this.storage = {
			sample: input.length * opt.size.length + opt.size.length,
			weights: input.length * opt.size.length + opt.size.length
		}


	}

	forward(ctx) {
		var sum = 0.0, X = this.dimensions.input.length, Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w, paramw = ctx.params.w
		var sampled = ctx.sample, weights = ctx.weights, epsilon = 0
		var mu, std, w, b

		if (ctx.state.options.uncertainty) {
			return this.uncertainty(ctx)
		}

		for (var i = 0; i < Y; i++) {
			sum = 0.0
			for (var j = 0; j < X; j++) {
				mu = paramw[(i * X + j) * 2 + 0] 
				std = Math.log(1 + Math.exp( paramw[(i * X + j) * 2 + 1] ))

				sampled[i * X + j] = epsilon = Math.randn()
				weights[i * X + j] = w = mu + std * epsilon

				sum += inpw[j] * w
			}

			mu = paramw[(X * Y + i) * 2 + 0] 
			std = Math.log(1 + Math.exp( paramw[(X * Y + i) * 2 + 1] ))

			sampled[X * Y + i] = epsilon = Math.randn()
			weights[X * Y + i] = b = mu + std * epsilon

			outw[i] = sum + b
		}

	}

	uncertainty(ctx) {
		var sum = 0.0, X = this.dimensions.input.length, Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w, paramw = ctx.params.w
		var std, mu, w, b, dir = ctx.state.options.uncertainty

		for (var i = 0; i < Y; i++) {
			sum = 0.0
			for (var j = 0; j < X; j++) {
				mu = paramw[(i * X + j) * 2 + 0] 
				std = Math.log(1 + Math.exp( paramw[(i * X + j) * 2 + 1] ))
				w = mu + dir * std

				sum += inpw[j] * w
			}

			mu = paramw[(X * Y + i) * 2 + 0] 
			std = Math.log(1 + Math.exp( paramw[(X * Y + i) * 2 + 1] ))
			b = mu + dir * std

			outw[i] = sum + b
		}
	}

	backward(ctx) {
		var sum = 0.0, X = this.dimensions.input.length, Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w, paramw = ctx.params.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw, paramdw = ctx.params.dw
		var sampled = ctx.sample, weights = ctx.weights

		for (var i = 0; i < X; i++) {
			sum = 0.0
			for (var j = 0; j < Y; j++) {
				paramdw[(j * X + i) * 2 + 0] = inpw[i] * outdw[j]
				paramdw[(j * X + i) * 2 + 1] = inpw[i] * outdw[j] * sampled[j * X + i] / (1.0 + Math.exp(-paramw[(j * X + i) * 2 + 1]))
				sum += weights[j * X + i] * outdw[j]
			}

			inpdw[i] = sum
		}

		for (var i = 0; i < Y; i++) {
			paramdw[(X * Y + i) * 2 + 0] = outdw[i]
			paramdw[(X * Y + i) * 2 + 1] = outdw[i] * sampled[X * Y + i] / (1.0 + Math.exp(-paramw[(X * Y + i) * 2 + 1]))
		}
	}

	initialize(params) {
		var H = this.dimensions.parameters / 2
		var elements = (this.dimensions.input.length + this.dimensions.output.length)
		var scale = Math.sqrt(2.0 / elements)

		for (var i = 0; i < H; i+=2) {
			params.w[i] = Math.randn() * scale
			params.w[i + 1] = Math.randn()
		}
	}

}

class ConfidenceLayer {

	constructor(input, opt) {

		this.dimensions = {
			input,
			output: new Size(1, 1, input.length / 2),
			parameters: 0
		}

		this.storage = {
			sample: this.dimensions.output.length
		}


	}

	forward(ctx) {
		var Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var sampled = ctx.sample

		for (var i = 0; i < Y; i++) {
			var mu = inpw[i * 2 + 0]
			var std = inpw[i * 2 + 1]

			sampled[i] = Math.randn()
			outw[i] = mu + sampled[i] * std
		}

	}

	backward(ctx) {
		var Y = this.dimensions.output.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw
		var sampled = ctx.sample

		for (var i = 0; i < Y; i++) {
			inpdw[i * 2 + 0] = outdw[i]
			inpdw[i * 2 + 1] = sampled[i] * outdw[i]
		}
	}


}

module.exports = {
	VariationalBayesianLayer, ConfidenceLayer
}