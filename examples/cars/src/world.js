var agent = require('./agent.js');

function world() {
    this.agents = [];
    this.p2 = new p2.World({
        gravity : [0,0]
    });

    this.p2.solver.tolerance = 0.4
    this.p2.solver.iterations = 10
    this.p2.setGlobalStiffness(4000)
    this.p2.setGlobalRelaxation(8)

    this.age = 0.0

    this.pool = new window.neurojs.MultiAgentPool()
}

world.prototype.addWall = function (start, end, width) {
    var w = 0, h = 0, pos = []
    if (start[0] === end[0]) { // hor
        h = end[1] - start[1];
        w = width
        pos = [ start[0], start[1] + 0.5 * h ]
    }
    else if (start[1] === end[1]) { // ver
        w = end[0] - start[0]
        h = width
        pos = [ start[0] + 0.5 * w, start[1] ]
    }
    else 
        throw 'error'

    // Create box
    var b = new p2.Body({
        mass : 0.0,
        position : pos
    });
    var rectangleShape = new p2.Box({ width: w, height:  h });
    rectangleShape.color = parseInt('DD' + 'DD' + 'DD', 16)
    b.addShape(rectangleShape);
    this.p2.addBody(b);
}

world.prototype.addPolygons = function (polys) {

    for (var i = 0; i < polys.length; i++) {
        var points = polys[i]
        var b = new p2.Body({ mass : 0.0 });
        if (b.fromPolygon(points, {
            removeCollinearPoints: 0.1,
            skipSimpleCheck: true
        })) {
             this.p2.addBody(b)
        }
    }
    
}

world.prototype.init = function (n) {
    for (var i = 0; i < n; i++) {
        var ag = new agent(this);
        ag.car.addToWorld();
        this.agents.push(ag);
    }

    this.addWall( [ -16.571428571428573, -10.671428571428573 ], [ -16.571428571428573, 10.671428571428573 ], 0.5 )
    this.addWall( [ 16.571428571428573, -10.671428571428573 ], [ 16.571428571428573, 10.671428571428573 ], 0.5 )
    this.addWall( [ -16.571428571428573, -10.671428571428573 ], [ 16.571428571428573, -10.671428571428573 ], 0.5 )
    this.addWall( [ -16.571428571428573, 10.671428571428573 ], [ 16.571428571428573, 10.671428571428573 ], 0.5 )
};

world.prototype.step = function (dt) {
    if (dt >= 0.02)  dt = 0.02;

    for (var i = 0; i < this.agents.length; i++) {
        this.agents[i].step(dt);
    }

    this.p2.step(1 / 60, dt, 10);
    this.age += dt
};

module.exports = world;