function keyboard() {
    this.handlers = {};
    this.subscribers = [];
    this.states = {};

    document.onkeydown = this.keydown.bind(this);
    document.addEventListener('keydown', this.keydown.bind(this), true);
    document.addEventListener('keyup', this.keyup.bind(this), true);
}

keyboard.prototype.keydown = function (e) {
    this.states[e.keyCode] = this.states[e.keyCode] !== undefined ? this.states[e.keyCode] + 1 : 1;

    if (this.handlers[e.keyCode]) {
        this.handlers[e.keyCode](true);
    }

    for (var i = 0; i < this.subscribers.length; i++) {
        this.subscribers[i](this);
    }
};

keyboard.prototype.keyup = function (e) {
    this.states[e.keyCode] = 0;

    if (this.handlers[e.keyCode]) {
        this.handlers[e.keyCode](false);
    }

    for (var i = 0; i < this.subscribers.length; i++) {
        this.subscribers[i](this);
    }
};

keyboard.prototype.listen = function (key, callback) {
    this.handlers[key] = callback;
};

keyboard.prototype.subscribe = function (callback) {
    this.subscribers.push(callback);
};

keyboard.prototype.get = function (key) {
    if (this.states[key])
        return this.states[key] > 0;

    return false;
};

keyboard.prototype.getN = function (key) {
    if (this.states[key])
        return this.states[key] > 0 ? 1 : 0;

    return 0;
};

keyboard.prototype.getD = function (key) {
    if (this.states[key])
        return this.states[key];

    return 0;
}

module.exports = keyboard;