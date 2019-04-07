var requestAnimFrame =  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 1000 / 60); };
var keyboard = require('./keyboard.js');

function dispatcher(renderer, world) {
    this.renderer = renderer;
    this.world = world;
    this.animating = true;
    this.counter = 0;

    this.keyboard = new keyboard();
    this.keyboard.subscribe((function (k) {
        for (var i = 0; i < this.world.agents.length; i++) {
            this.world.agents[i].car.handleKeyboard(k);
        }
    }).bind(this));

    this.animationLoop = (now) => {
        if (this.animating) { 
            requestAnimFrame(this.animationLoop.bind(this));
        }

        const dt = this.dt();
        this.step(dt);
    };

    this.intervalLoop = () => {
        const dt = 1/60;
        this.step(dt);
    };
}

dispatcher.prototype.dt = function () {
    var now = Date.now(); 
    var diff = now - (this.prev || now);
    this.prev = now; 

    return diff / 1000;
};

dispatcher.prototype.step = function (dt) {
    // compute phyiscs
    this.world.step(dt);
    this.counter++;

    // draw everything
    if (this.animating || this.counter % 20 == 0) {
        this.renderer.render();
    }
};

dispatcher.prototype.begin = function (mode = 'animation') {
    if (this.interval) {
        clearInterval(this.interval);
    }

    if (mode === 'interval') {
        this.animating = false;
        this.interval = setInterval(this.intervalLoop, 0);
    }
    else if (mode === 'animation') {
        this.animating = true;
        requestAnimFrame(this.animationLoop);
    }
    else {
        throw 'Unknown mode.';
    }

    this.mode = mode;
};

dispatcher.prototype.goFast = function () {
    this.begin('interval');
};

dispatcher.prototype.goSlow = function () {
    this.begin('animation');
}

dispatcher.prototype.stop = function () {
    this.animating = false;
    clearInterval(this.interval);
};

module.exports = dispatcher;