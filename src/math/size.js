module.exports = class Size {

	static derive(val) {
		if (val instanceof Size)
			return val;

		if (Number.isInteger(val))
			return new Size(1, 1, val);

		throw "could not derive size";
	}

	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.length = this.x * this.y * this.z;
	}

	get dimensions() {
		if (this.x * this.y * this.z === 0)
			return 0

		if (this.x * this.y === 1)
			return 1

		if (this.x === 1)
			return 2

		return 3
	}

}