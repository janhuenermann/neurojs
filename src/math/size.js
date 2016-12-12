module.exports = class Size {

	static derive(val) {
		if (val instanceof Size) {
			return val;
		}

		if (Number.isInteger(val)) {
			return new Size(1, 1, val)
		}

		if (val instanceof Object) {
			return new Size(val.x, val.y, val.z)
		}

		throw "Could not create size object";
	}

	constructor(x, y, z) {
		this.x = x
		this.y = y
		this.z = z
	}

	get length() {
		return this.x * this.y * this.z
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