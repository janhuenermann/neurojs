var requestAnimFrame =  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); };

class dispatcher {

	constructor(renderer, world) {
		this.running = false
		this.renderer = renderer
		this.world = world
	}

	begin() {
		this.running = true
		requestAnimFrame(this.loop)
	}

	loop() {
		if (this.running) {
			requestAnimFrame(this.loop)
		}

		this.world.step(1.0 / 60)
		this.renderer.render()
	}

}

module.exports = dispatcher