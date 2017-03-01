var app = require('./index.js');
var car = require('./car.js');

function createLossChart() {
    var data = {
        series: [[], []]
    };

    return new Chartist.Line('.ct-chart', data, {
        lineSmooth: Chartist.Interpolation.none()
    });
}

function boot() {
    this.world = new app.world();
    this.renderer = new app.renderer(this.world, document.getElementById("container"));

    this.world.init(this.renderer)
    this.world.populate(4)

    this.dispatcher = new app.dispatcher(this.renderer, this.world);
    this.dispatcher.begin();

    this.world.chart = createLossChart();

    return this.dispatcher;
};

function saveAs(dv, name) {
    var a;
    if (typeof window.downloadAnchor == 'undefined') {
        a = window.downloadAnchor = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
    } else {
        a = window.downloadAnchor
    }

    var blob = new Blob([dv], { type: 'application/octet-binary' }),
        tmpURL = window.URL.createObjectURL(blob);

    a.href = tmpURL;
    a.download = name;
    a.click();

    window.URL.revokeObjectURL(tmpURL);
    a.href = "";
}

function downloadBrain(n) {
	var buf = window.gcd.world.agents[n].brain.export()
	saveAs(new DataView(buf), 'brain.bin')
}

function saveEnv() {
    saveAs(new DataView(window.gcd.world.export()), 'world.bin')
}

function readBrain(e) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var buffer = reader.result
        var imported = window.neurojs.NetOnDisk.readMultiPart(buffer)

        for (var i = 0; i <  window.gcd.world.agents.length; i++) {
            window.gcd.world.agents[i].brain.algorithm.actor.set(imported.actor.clone())
            window.gcd.world.agents[i].brain.algorithm.critic.set(imported.critic)
            // window.gcd.world.agents[i].car.brain.learning = false
        }
    };

    reader.readAsArrayBuffer(input.files[0]);
}


function readWorld(e) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var buffer = reader.result
        window.gcd.world.import(buffer)
    };

    reader.readAsArrayBuffer(input.files[0]);
}

window.infopanel = {
    age: document.getElementById('agent-age')
}

function stats() {
    var agent = window.gcd.world.agents[0];
    window.infopanel.age.innerText = Math.floor(window.gcd.world.age) + '';
}

window.gcd = boot();
window.downloadBrain = downloadBrain;
window.saveEnv = saveEnv
window.readWorld = readWorld
window.updateIfLearning = function (value) {
    for (var i = 0; i <  window.gcd.world.agents.length; i++) {
        window.gcd.world.agents[i].brain.learning = value
    }

    window.gcd.world.plotRewardOnly = !value
};

window.readBrain = readBrain;

setInterval(stats, 100);