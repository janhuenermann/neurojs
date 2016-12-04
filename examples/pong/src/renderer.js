
class renderer {

	constructor(world, container) {
		this.world = world;
	    this.world.p2.on("addBody", (function(e){
	        this.add_body(e.body);
	    }).bind(this));

	    this.elementContainer = container
	    this.pixelRatio = window.devicePixelRatio || 1;

	    this.pixi = new PIXI.autoDetectRenderer(0, 0, {
	        antialias: true,
	        resolution: this.pixelRatio,
	        transparent: true
	    }, false);

	    this.stage = new PIXI.Container()
	    this.container = new PIXI.DisplayObjectContainer()

	    this.stage.addChild(this.container)

	    this.pixi.view.style.width = "100%";
	    this.pixi.view.style.height = "100%";
	    this.elementContainer.appendChild(this.pixi.view);

	    this.bodies = [];
	    this.viewport = { scale: 35, center: [0,0], width: 0, height: 0 };

	    // resize the canvas to fill browser window dynamically
	    window.addEventListener('resize', this.events.resize.bind(this), false);
	    this.adjustBounds();

	    this.drawingGraphic = new PIXI.Graphics()
	    this.container.addChild(this.drawingGraphic)
	}

}