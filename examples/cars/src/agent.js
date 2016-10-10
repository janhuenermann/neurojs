var car = require('./car.js');

function agent(world) {
    this.car = new car(world, {});
    this.init();
};

agent.prototype.init = function () {
};

agent.prototype.step = function (dt) {
    this.car.update(dt);
};

agent.prototype.draw = function (context) {
};

module.exports = agent;