"use strict";

class DropOutLayer {

	constructor(input, opt) {
		this.dimensions = {
			input,
			output: input,
			parameters: 0
		}

		this.probability = opt.probability
		this.storage = {
			activations: input
		}
	}

	forward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var prob = this.probability, act = ctx.activations

		// if (ctx.state.options.learning !== true) {
		// 	for (var i = 0; i < X; i++)
		// 		outw[i] = inpw[i] * prob 
			
		// 	return 
		// }

		for (var i = 0; i < X; i++) {
			if (Math.random() < prob) { // dropping out
				outw[i] = 0.0
				act[i] = 0.0
			}

			else {
				outw[i] = inpw[i] / (1.0 - prob)
				act[i] = 1.0
			}
		}
	}

	backward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw
		var prob = this.probability, act = ctx.activations

		// if (ctx.state.options.learning !== true) {
		// 	// for (var i = 0; i < X; i++)
		// 	// 	inpdw[i] = outdw[i] * prob 

		// 	return
		// }

		for (var i = 0; i < X; i++) {
			inpdw[i] = act[i] * outdw[i] / (1.0 - prob)
		}
	}

}

module.exports = {
	DropOutLayer
};