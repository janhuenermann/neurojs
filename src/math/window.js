class Window {

	constructor(n) {
		this.list = []
		this.length = n
	}

	push(value) {
		this.list.unshift(value)

		if (this.list.length > this.length) {
			this.list.pop()
		}
	}

	get(nth) {
		return this.list[nth]
	}

	get size() {
		return this.list.length
	}

}

module.exports = Window