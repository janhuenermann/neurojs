class ReplayBuffer {

	add(e) { throw 'not implemented' }
	sample(n) { throw 'not implemented' }
	getAverageLoss() { throw 'not implemented' }
	getImportanceSamplingWeight(e) { return 1.0 }
	updateAfterLearning() {}

}

class UniformReplayBuffer extends ReplayBuffer {

	constructor(size) {
		super()
		this.buffer = []
		this.size = size
	}

	add(e) {

		if (this.buffer.length >= this.size) {
			this.buffer[Math.randi(0, this.buffer.length)] = e
		}

		else {
			this.buffer.push(e)
		}
		
	}

	sample(n) {
		var batch = []

		if (this.buffer.length <= n)
			return this.buffer
		
		for (var i = 0; i < n; i++) {
			batch.push(Array.random(this.buffer))
		}

		return batch
	}

	draw() {
		return Array.random(this.buffer)
	}

	getAverageLoss() {
		return Array.sum(this.buffer, x => x.loss) / this.buffer.length
	}

}

class PrioritizedReplayBuffer extends ReplayBuffer {

	constructor(N) {
		super()

		this.root = new PrioritizedReplayBuffer.Node(null, null)
		this.iterations = 0
		this.size = 0

		this.maxISW = 1.0
		this.beta = 0.5

		for (var i = 0; i < N - 1; ++i) {
			this.root.add(null)
		}

		this.leafs = this.root.getLeafs()

		if (this.leafs.length !== this.root.size)
			throw 'could not create replay tree...'
	}

	add(e) {
		if (this.size === this.leafs.length) {
			this.root.descent((a, b) => a.minimum < b.minimum ? 0 : 1).set(e)
		}

		else {
			this.leafs[this.size].set(e)
		}
		
		this.iterations += 1
		this.size = Math.max(this.size, this.iterations % this.leafs.length)
	}

	sample(n) { 
		var batch = []

		this.maxISW = Math.pow(this.size * (this.root.minimum / this.root.value), -this.beta)

		if (this.size < 5 * n) 
			return [ ]

		while (batch.length < n)
			batch.push(this.root.cumulativeSample(Math.random() * this.root.value).experience)

		return batch
	}

	draw(prioritised) {
		if (!prioritised) 
			return this.leafs[Math.randi(0, this.size)].experience

		return this.root.cumulativeSample(Math.random() * this.root.value).experience
	}

	updateAfterLearning(batch) {
		for (var i = 0; i < batch.length; i++) {
			var e = batch[i]
			if (e !== e.node.experience)
				throw 'association error'

			e.node.revalue()
		}
	}

	getImportanceSamplingWeight(e) { 
		if (e.priority === undefined)
			return 1.0

		return Math.pow(this.size * (e.priority / this.root.value), -this.beta)
	}

	getAverageLoss() {
		return this.root.value / this.root.size
	}

}

PrioritizedReplayBuffer.Node = class Node {

	constructor(parent, experience) {
		this.parent = parent
		this.children = []
		this.size = 1
		this.value = 0.0

		this.maximum = -Infinity
		this.minimum = Infinity

		this.experience = experience
		this.revalue()
	}


	cumulativeSample(x) {
		if (this.children.length === 0)
			return this

		if (this.children[0].value < x)
			return this.children[1].cumulativeSample(x - this.children[0].value)
		else 
			return this.children[0].cumulativeSample(x)
	} 

	update() {
		this.value = Array.sum(this.children, x => x.value)
		this.maximum = this.children.reduce((a, b) => a.maximum > b.maximum ? a : b).maximum
		this.minimum = this.children.reduce((a, b) => a.minimum < b.minimum ? a : b).minimum

		if (this.parent)
			this.parent.update()
	}

	revalue() {
		if (this.children.length > 0)
			throw 'not possible'

		if (!this.experience)
			return 

		this.value = this.experience.priority || Infinity

		this.maximum = this.value
		this.minimum = this.value

		if (this.parent)
			this.parent.update()
	}

	set(experience) {
		if (this.children.length > 0)
			throw "can't set experience of node with children"

		experience.node = this

		this.experience = experience
		this.revalue()
	}

	add(experience) {
		if (this.children.length === 0) { // branch off
			this.children.push(new PrioritizedReplayBuffer.Node(this, this.experience))
			this.children.push(new PrioritizedReplayBuffer.Node(this, experience))
			this.experience = null

			// this.update()
		} else {
			this.children.reduce((a, b) => a.size < b.size ? a : b).add(experience)
		}

		this.size++
	}

	descent(dir) {
		if (this.children.length === 0)
			return this

		return this.children[ dir(this.children[0], this.children[1]) ].descent(dir)
	}

	getLeafs() {
		if (this.children.length === 0)
			return [ this ]

		var unfolded = []
		for (var i = 0; i < this.children.length; i++) {
			unfolded.push(this.children[i].getLeafs())
		}

		return Array.prototype.concat.apply([], unfolded)
	}

}

module.exports = {

	ReplayBuffer, 
	UniformReplayBuffer, 
	PrioritizedReplayBuffer

}