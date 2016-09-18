var app = require('./src/index.js');

function boot() {
    this.world = new app.world();
    this.renderer = new app.renderer(this.world);

    this.world.init(3);

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
	var weights = window.gcd.world.agents[0].car.brain.export()
	saveAs(new DataView(weights.buffer))
}

window.gcd = boot();
window.downloadBrain = downloadBrain