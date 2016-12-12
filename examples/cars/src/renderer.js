

function renderer(world, container) {
    this.world = world;
    this.world.p2.on("addBody", (e) => {
        this.add_body(e.body)
    });

    this.world.p2.on("removeBody", (e) => {
        this.remove_body(e.body)
    })

    if (container) {
        this.elementContainer = container
    }

    else {
        this.elementContainer = document.createElement("div");
        this.elementContainer.style.width = "100%";
        // this.elementContainer.style.height = "100%";
        document.body.appendChild(this.elementContainer)
    }

    this.pixelRatio = window.devicePixelRatio || 1;

    this.pixi = new PIXI.autoDetectRenderer(0, 0, {
        antialias: true,
        resolution: this.pixelRatio,
        transparent: true
    }, false);
    // this.pixi.backgroundColor = 0xFFFFFF;

    this.stage = new PIXI.Container()
    this.container = new PIXI.DisplayObjectContainer()

    this.stage.addChild(this.container)

    this.drawPoints = []

    this.elementContainer.addEventListener("mousedown", (function (e) {
        this.mousedown(this.mousePositionFromEvent(e)) 
    }).bind(this)); 

    this.elementContainer.addEventListener("mousemove", (function (e) {
        if(e.which !== 1)
            return 

        this.mousemove(this.mousePositionFromEvent(e)) 
    }).bind(this))

    this.elementContainer.addEventListener("mouseup", (function (e) {
        this.mouseup(this.mousePositionFromEvent(e))
    }).bind(this)); 

    this.pixi.view.style.width = "100%";
    this.pixi.view.style.height = "100%";
    this.pixi.view.style.border = "5px solid #EEE";
    this.elementContainer.appendChild(this.pixi.view);

    this.bodies = [];
    this.viewport = { scale: 35, center: [0,0], width: 0, height: 0 };

    // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', this.events.resize.bind(this), false);
    this.adjustBounds();

    this.drawingGraphic = new PIXI.Graphics()
    this.container.addChild(this.drawingGraphic)
};

renderer.prototype.events = {};
renderer.prototype.events.resize = function () {
    this.adjustBounds();
    this.pixi.render(this.stage);
};

renderer.prototype.mousePositionFromEvent = function (e) {
    var rect = this.pixi.view.getBoundingClientRect()
    var x = e.clientX - rect.left
    var y = e.clientY - rect.top
    return PIXI.interaction.InteractionData.prototype.getLocalPosition(this.stage, null, new PIXI.Point(x, y))
};


renderer.prototype.adjustBounds = function () {
    var outerW = this.elementContainer.offsetWidth
    var outerH = outerW / 3 * 2

    this.viewport.width = outerW
    this.viewport.height = outerH
    this.viewport.scale = outerW / 1200 * 35

    this.offset = this.pixi.view.getBoundingClientRect()
    this.offset = {
        top: this.offset.top + document.body.scrollTop,
        left: this.offset.left + document.body.scrollLeft
    }

    this.pixi.resize(this.viewport.width, this.viewport.height)
 };

renderer.prototype.render = function () {
    for (var i = 0; i < this.bodies.length; i++) {
        this.update_body(this.bodies[i]);
    }

    this.update_stage(this.stage);
    this.pixi.render(this.stage);
};

renderer.prototype.update_stage = function (stage) {
    stage.scale.x = this.viewport.scale;
    stage.scale.y = this.viewport.scale;
    stage.position.x = this.viewport.center[0] + this.viewport.width / 2;
    stage.position.y = this.viewport.center[1] + this.viewport.height / 2;
};

renderer.prototype.update_body = function (body) {
    body.gl_sprite.position.x = body.interpolatedPosition[0]
    body.gl_sprite.position.y = body.interpolatedPosition[1]
    body.gl_sprite.rotation = body.interpolatedAngle
};

renderer.prototype.create_sprite = function (body) {

    var sprite = new PIXI.Graphics();

    this.draw_sprite(body, sprite);
    this.stage.addChild(sprite);

    if (body.gl_create) {
        body.gl_create(sprite, this);
    }

    return sprite;
};

renderer.prototype.draw_path = function (sprite, path, opt) {
    if (path.length < 2) 
        return ;

    if (typeof opt.line !== 'undefined') {
        sprite.lineStyle(opt.line.width, opt.line.color, opt.line.alpha);
    }
    
    if (typeof opt.fill !== 'undefined') {
        sprite.beginFill(opt.fill.color, opt.fill.alpha);
    }
    
    sprite.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) {
        var p = path[i];
        sprite.lineTo(p[0], p[1]);
    }

    if (opt.fill !== 'undefined') {
        sprite.endFill();
    }
}

renderer.prototype.draw_rect = function (sprite, bounds, angle, opt) {
    var w = bounds.w, h = bounds.h, x = bounds.x, y = bounds.y;
    var path = [
        [w / 2, h / 2],
        [-w / 2, h / 2],
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2]
    ];

    // Rotate and add position
    for (var i = 0; i < path.length; i++) {
        var v = path[i];
        p2.vec2.rotate(v, v, angle);
        p2.vec2.add(v, v, [x, y]);
    }

    this.draw_path(sprite, path, opt);
}

renderer.prototype.draw_sprite = function (body, sprite) {
    sprite.clear();

    var color = body.color
    var opt = {
        line: { color: color, alpha: 1, width: 0.01 },
        fill: { color: color, alpha: 1.0 }
    }

    if(body.concavePath){
        var path = []

        for(var j=0; j!==body.concavePath.length; j++){
            var v = body.concavePath[j]
            path.push([v[0], v[1]])
        }

        this.draw_path(sprite, path, opt)

        return 
    }

    for (var i = 0; i < body.shapes.length; i++) {
        var shape = body.shapes[i],
            offset = shape.position,
            angle = shape.angle;

        var shape_opt = opt
        if (shape.color) {
            shape_opt = {
                line: { color: shape.color, alpha: 1, width: 0.01 },
                fill: { color: shape.color, alpha: 1.0 }
            }
        }

        if (shape instanceof p2.Box) {
            this.draw_rect(sprite, { w: shape.width, h: shape.height, x: offset[0], y: offset[1] }, angle, shape_opt);
        }

        else if (shape instanceof p2.Convex) {
            var path = [], v = p2.vec2.create();
            for(var j = 0; j < shape.vertices.length; j++){
                p2.vec2.rotate(v, shape.vertices[j], angle);
                path.push([v[0]+offset[0], v[1]+offset[1]]);
            }

            this.draw_path(sprite, path, shape_opt);
        }
    }
};  

renderer.prototype.add_body = function (body) {
    if (body instanceof p2.Body && body.shapes.length && !body.hidden) {
        body.gl_sprite = this.create_sprite(body);
        this.update_body(body);
        this.bodies.push(body);
    }
};

renderer.prototype.remove_body = function (body) {
    if (body.gl_sprite) {
        this.stage.removeChild(body.gl_sprite)

        for (var i = this.bodies.length; --i; ) {
            if (this.bodies[i] === body) {
                this.bodies.splice(i, 1);
            }
        }
    }
};

renderer.prototype.zoom = function (factor) {
    this.viewport.scale *= factor;
};

var sampling = 0.4
renderer.prototype.mousedown = function (pos) {
    this.drawPoints = [ [ pos.x, pos.y ] ]
};

renderer.prototype.mousemove = function (pos) {
    pos = [ pos.x, pos.y ]

    var sqdist = p2.vec2.distance(pos,this.drawPoints[this.drawPoints.length-1]);
    if (sqdist > sampling*sampling){
        this.drawPoints.push(pos)

        this.drawingGraphic.clear()
        this.draw_path(this.drawingGraphic, this.drawPoints, {
            line: {
                width: 0.02,
                color: 0xFF0000,
                alpha: 0.9
            }
        })
    }
}

renderer.prototype.mouseup = function (pos) {
    if (this.drawPoints.length > 2) {    
        this.world.addBodyFromPoints(this.drawPoints)
    }

    this.drawPoints = []
    this.drawingGraphic.clear()
};


module.exports = renderer;