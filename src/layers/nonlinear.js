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
		var inpw = ctx.input.w, outw = ctx.output.w

		for (var i = 0; i < X; i++) {
			outw[i] = 1 / (1 + Math.exp(-inpw[i]))
		}
	}

	backward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw

		for (var i = 0; i < X; i++) {
			inpdw[i] = outw[i] * (1.0 - outw[i]) * outdw[i]
		}
	}

}

class TanhLayer extends NonLinearityLayer {

	forward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var y = 0.0;

		for (var i = 0; i < X; i++) {
			y = Math.exp(2 * inpw[i]);
			outw[i] = (y - 1) / (y + 1);
		}
	}

	backward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw

		for (var i = 0; i < X; i++) {
			inpdw[i] = (1 - outw[i] * outw[i]) * outdw[i];
		}
	}

}

class ReLULayer extends NonLinearityLayer {

	constructor(input, opt) {
		super(input, opt)
		this.leaky = opt.leaky || 0
	}

	forward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var y = 0.0;

		for (var i = 0; i < X; i++) {
			outw[i] = (inpw[i] > 0.0 ? inpw[i] : this.leaky * inpw[i]);
		}
	}

	backward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw

		for (var i = 0; i < X; i++) {
			inpdw[i] = (inpw[i] > 0.0 ? 1.0 : this.leaky) * outdw[i];
		}
	}

}

class ELULayer extends NonLinearityLayer {

	constructor(input, opt) {
		super(input, opt)
		this.alpha = opt.alpha || 1.0
	}

	forward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var y = 0.0;

		for (var i = 0; i < X; i++) {
			outw[i] = (inpw[i] > 0.0 ? inpw[i] : this.alpha * (Math.exp(inpw[i]) - 1));
		}
	}

	backward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpdw = ctx.input.dw, outdw = ctx.output.dw

		for (var i = 0; i < X; i++) {
			inpdw[i] = (inpw[i] > 0.0 ? 1.0 : outw[i] + this.alpha) * outdw[i];
		}
	}

}

module.exports = {
	SigmoidLayer, TanhLayer, ReLULayer, ELULayer
};