var app = require('./src/index.js');

function boot() {
    this.world = new app.world();
    this.renderer = new app.renderer(this.world, document.getElementById("container"));

    this.world.init(4);

    this.dispatcher = new app.dispatcher(this.renderer, this.world);
    this.dispatcher.begin();

    return this.dispatcher;
};

function saveAs(dv) {
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
    a.download = 'brain.bin';
    a.click();

    window.URL.revokeObjectURL(tmpURL);
    a.href = "";
}

function downloadBrain(n) {
	var weights = window.gcd.world.agents[n].car.brain.export()
	saveAs(new DataView(weights.buffer))
}

function readBrain(e) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var buffer = reader.result;
        var params = new Float64Array(buffer);
        for (var i = 0; i <  window.gcd.world.agents.length; i++) {
            window.gcd.world.agents[i].car.brain.import(params);
            // window.gcd.world.agents[i].car.brain.learning = false;
        }
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
window.readBrain = readBrain;

setInterval(stats, 100);