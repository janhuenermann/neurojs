var Size = require('./size.js');

module.exports = class Tensor {

	constructor(size) {
		this.size = Size.derive(size)
		this.w = new Float64Array(this.size.length);
		this.dw = new Float64Array(this.size.length);
	}

}