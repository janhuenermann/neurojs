"use strict";

var Size = require('../math/size.js');

class InputLayer {

	constructor(inp, opt) {
		this.dimensions = {
			input: Size.derive(opt.size),
			output: Size.derive(opt.size),
			parameters: 0
		};

		this.input = true
		this.passthrough = true
	}

	toInputVector(input, out) {
		if (input === undefined)
			return 

		if (Number.isInteger(input) && input < this.dimensions.intrinsic) {
			out.fill(0.0)
			out[input] = 1.0
		} 

		else if (input.length === out.length) {
			out.set(input)
		} 

		else {
			throw 'invalid input format';
		}
	}

}

module.exports = {
	InputLayer
}