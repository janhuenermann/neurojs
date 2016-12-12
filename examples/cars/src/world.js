var agent = require('./agent.js')
var color = require('./color.js')

function world() {
    this.agents = [];
    this.p2 = new p2.World({
        gravity : [0,0]
    });

    this.p2.solver.tolerance = 5e-2
    this.p2.solver.iterations = 15
    this.p2.setGlobalStiffness(1e6)
    this.p2.setGlobalRelaxation(5)

    this.age = 0.0
    this.timer = 0

    this.chartData = {}
    this.chartEphemeralData = []
    this.chartFrequency = 60
    this.chartDataPoints = 200
    this.smoothReward = 0

    this.plotRewardOnly = false

    this.obstacles = []

    var input = 118, actions = 2
    this.brains = {

        actor: new window.neurojs.Network.Model([

            { type: 'input', size: input },
            { type: 'fc', size: 50, activation: 'relu' },
            { type: 'fc', size: 50, activation: 'relu' },
            { type: 'fc', size: 50, activation: 'relu', dropout: 0.5 },
            { type: 'fc', size: actions, activation: 'tanh' },
            { type: 'regression' }

        ]),


        critic: new window.neurojs.Network.Model([

            { type: 'input', size: input + actions },
            { type: 'fc', size: 100, activation: 'relu' },
            { type: 'fc', size: 100, activation: 'relu' },
            { type: 'fc', size: 1 },
            { type: 'regression' }

        ])

    }

    this.brains.shared = new window.neurojs.Shared.ConfigPool()

    this.brains.shared.set('actor', this.brains.actor.newConfiguration())
    this.brains.shared.set('critic', this.brains.critic.newConfiguration())
};

world.prototype.addBodyFromCompressedPoints = function (outline) {
    if (outline.length % 2 !== 0) {
        throw 'Invalid outline.';
    }

    var points = []
    for (var i = 0; i < (outline.length / 2); i++) {
        var x = outline[i * 2 + 0]
        var y = outline[i * 2 + 1]
        points.push([ x, y ])
    }

    this.addBodyFromPoints(points)
};

world.prototype.addBodyFromPoints = function (points) {
    var body = new p2.Body({ mass : 0.0 });
    body.color = color.randomPastelHex()

    if(!body.fromPolygon(points.slice(0), { removeCollinearPoints: 0.1 })) {
        return 
    }

    var outline = new Float64Array(points.length * 2)
    for (var i = 0; i < points.length; i++) {
        outline[i * 2 + 0] = points[i][0]
        outline[i * 2 + 1] = points[i][1]
    }

    body.outline = outline
    this.addObstacle(body)
};

world.prototype.addObstacle = function (obstacle) {
    this.p2.addBody(obstacle)
    this.obstacles.push(obstacle)
};

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
    // rectangleShape.color = 0xFFFFFF
    b.hidden = true;
    b.addShape(rectangleShape);
    this.p2.addBody(b);

    return b;
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

world.prototype.init = function (renderer) {
    window.addEventListener('resize', this.resize.bind(this, renderer), false);

    var w = renderer.viewport.width / renderer.viewport.scale
    var h = renderer.viewport.height / renderer.viewport.scale
    var wx = w / 2, hx = h / 2

    this.addWall( [ -wx - 0.25, -hx ], [ -wx - 0.25, hx ], 0.5 )
    this.addWall( [ wx + 0.25, -hx ], [ wx + 0.25, hx ], 0.5 )
    this.addWall( [ -wx, -hx - 0.25 ], [ wx, -hx - 0.25 ], 0.5 )
    this.addWall( [ -wx, hx + 0.25 ], [ wx, hx + 0.25 ], 0.5 )

    this.size = { w, h }
};

world.prototype.populate = function (n) {
    for (var i = 0; i < n; i++) {
        var ag = new agent({}, this);
        this.agents.push(ag);
    }
};

world.prototype.resize = function (renderer) {
};

world.prototype.step = function (dt) {
    if (dt >= 0.02)  dt = 0.02;

    ++this.timer

    var loss = 0.0, reward = 0.0, agentUpdate = false
    for (var i = 0; i < this.agents.length; i++) {
        agentUpdate = this.agents[i].step(dt);
        loss += this.agents[i].loss
        reward += this.agents[i].reward
    }

    this.brains.shared.step()

    if (!this.plotting && (this.agents[0].brain.training || this.plotRewardOnly) && 1 === this.timer % this.chartFrequency) {
        this.plotting = true
    }

    if (this.plotting) {
        this.chartEphemeralData.push({
            loss: loss / this.agents.length, 
            reward: reward / this.agents.length
        })

        if (this.timer % this.chartFrequency == 0) {
            this.updateChart()
            this.chartEphemeralData = []
        }
    }
    

    this.p2.step(1 / 60, dt, 10);
    this.age += dt
};

world.prototype.updateChart = function () {
    var point = { loss: 0, reward: 0 }

    if (this.chartEphemeralData.length !== this.chartFrequency) {
        throw 'error'
    }

    for (var i = 0; i < this.chartFrequency; i++) {
        var subpoint = this.chartEphemeralData[i]
        for (var key in point) {
            point[key] += subpoint[key] / this.chartFrequency
        }
    }

    if (point.reward) {
        var f = 1e-2;
        this.smoothReward = this.smoothReward * (1.0 - f) + f * point.reward;
        point.smoothReward = this.smoothReward;
    }

    var series = []
    for (var key in point) {
        if (!(key in this.chartData)) {
            this.chartData[key] = []
        }

        this.chartData[key].push(point[key])

        if (this.chartData[key].length > this.chartDataPoints) {
            this.chartData[key] = this.chartData[key].slice(-this.chartDataPoints)
        }

        if (this.plotRewardOnly && (key !== 'reward' && key !== 'smoothReward')) {
            series.push({
                name: key,
                data: []
            })
        } 

        else {
           series.push({
                name: key,
                data: this.chartData[key]
            })
        }
    }

    this.chart.update({
        series
    })
};

world.prototype.export = function () {
    var contents = []
    contents.push({
        obstacles: this.obstacles.length
    })

    for (var i = 0; i < this.obstacles.length; i++) {
        contents.push(this.obstacles[i].outline)
    }

    var agents = []
    for (var i = 0; i < this.agents.length; i++) {
        agents.push({
            location: this.agents[i].car.chassisBody.position,
            angle: this.agents[i].car.chassisBody.angle
        })
    }

    contents.push(agents)

    return window.neurojs.Binary.Writer.write(contents)
};

world.prototype.clearObstacles = function () {
    for (var i = 0; i < this.obstacles.length; i++) {
        this.p2.removeBody(this.obstacles[i])
    }

    this.obstacles = []
};

world.prototype.import = function (buf) {
    this.clearObstacles()

    var contents = window.neurojs.Binary.Reader.read(buf)
    var j = -1
    var meta = contents[++j]

    for (var i = 0; i < meta.obstacles; i++) {
        this.addBodyFromCompressedPoints(contents[++j])
    }

    var agents = contents[++j]

    if (agents.length !== this.agents.length) {
        throw 'error';
    }

    for (var i = 0; i < agents.length; i++) {
        this.agents[i].car.chassisBody.position = agents[i].location
        this.agents[i].car.chassisBody.angle = agents[i].angle
    }
};

module.exports = world;