"use strict";

Object.assign(RegExp, {

    escape(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }

});

Object.assign(Function.prototype, {

    getArguments() {
        const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const ARGUMENT_NAMES = /([^\s,]+)/g;

        if (this.$args)
            return this.$args;

        var fnStr = this.toString().replace(STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if (result === null)
            result = [];

        return this.$args = result;
    },

    getSource() {
        return this.toString().replace(/^[^{]+{/i, '').replace(/}[^}]*$/i, '')
    },

    decompile() {
        return { arguments: this.getArguments(), source: this.getSource() };
    }

});

Object.assign(Object, {

    each(obj, callback) {
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                callback(key, obj[key]);
    }

});

Object.assign(String.prototype, {

    replaceAll(find, replace) {
        return this.replace(new RegExp(RegExp.escape(find), 'g'), replace);
    }

});

/**
 * How to use this optimizer:
 *
 * 1. First initialize with options e.g.
 *     var optimizer = new Optim({
 *         method: 'adadelta',
 *         regularization: { l2: 1e-2 },
 *         clipping: 5
 *     })
 * 2. Then create a (weight) tensor:
 *     var toOptimize = new Tensor(100)
 * 3. And prepare the tensor for optimization
 *     optimizer.initialize(toOptimize)
 * 4. Then add a gradient to the tensor (not practical like this, but you get the hang of it)
 *     toOptimize.dw[50] = 1.0
 * 5. Accumulate gradient (do this n-times if n is your batch count)
 *     optimizer.accumulate(toOptimize)
 * 6. Finally apply gradient optimization via
 *     optimizer.apply(toOptimize)
 * 
 */

class Optim {

    constructor(opt) {
        this.update(opt || {});
        this.uuid = ++Optim.INDEX
    }

    update(opt) {
        this.method = opt.method || 'sgd';
        this.options = Object.assign({

            type: 'descent',
            clipping: 0,
            regularization: {
                l1: 0,
                l2: 0
            }

        }, Optim.methods[this.method].options, opt);

        delete this.options.method;

        this.options = Object.freeze(this.options);

        this.build();
    }

    build() {
        if (this.options.type === 'descent')
            this.apply = this.assemble('-')
        else if (this.options.type === 'ascent')
            this.apply = this.assemble('+')
        else 
            throw 'unrecognized optimizer type'
    }

    assemble(dir) {
        var method = Optim.methods[this.method];
        var regDir = dir === '+' ? '-' : '+'

        var performer = (method.deliver ? method.deliver(this.options) : method.perform).decompile();
        var stateDefs = [], produceDefs = [];

        this.states = performer.arguments;

        for (var i = 0; i < this.states.length; i++) {
            stateDefs.push(this.states[i] + '=' + 'dw.' + this.states[i]);
        }

        function _definitions() {
            var defs = '';
            if (stateDefs.length > 0)
                defs += 'var ' + stateDefs.join(',') + ';';

            if (produceDefs.length > 0)
                defs += 'var ' + produceDefs.join(',') + ';';

            return defs;
        }

        function _gradient() {
            var producer = '';
            if (this.options.clipping > 0) {
                producer += 'grad = grad > opt.clipping ? opt.clipping : (grad < -opt.clipping ? -opt.clipping : grad);\n';
            }

            var sum = 'grad';
            if (this.options.regularization.l1 > 0) {
                produceDefs.push('l1grad');
                producer += 'l1grad = opt.regularization.l1 * (w[i] > 0 ? ' + regDir + '1 : ' + dir + '1);\n';
                sum += '+l1grad';
            }

            if (this.options.regularization.l2 > 0) {
                produceDefs.push('l2grad');
                producer += 'l2grad = opt.regularization.l2 * w[i] * ' + regDir + '1.0;\n';
                sum += '+l2grad';
            }

            producer += 'gij = ' + '(' + sum + ') / iteration' + ';\n';

            return { source: producer };
        }

        function replaceOptionsWithConstants(k, v) {
            if (typeof v === 'object') {
                Object.each(v, replaceOptionsWithConstants.bind(this + k + '.'));
                return;
            }

            fn = fn.replaceAll(this + k, v);
        }

        var grad = _gradient.call(this);

        var fn =
            `"use strict";
            var w = tensor.w, dw = tensor.dw, accdw = dw.acc;
            var dx, gij, grad, iteration = dw.iteration;
            if (iteration < 1) return ;
            ${ _definitions() }
            for (var i = 0; i < w.length; ++i) {
                grad = accdw[i];
                ${ grad.source }
                ${ performer.source }
                w[i] ${ dir }= dx;
                accdw[i] = 0.0;
            }
            dw.iteration = 0;`;

        Object.each(this.options, replaceOptionsWithConstants.bind('opt.'));
        return new Function('tensor', fn);
    }

    accumulate(tensor, weighted) {
        weighted = weighted || 1
        var w = tensor.w, dw = tensor.dw, accdw = dw.acc;
        var dx, gij, grad, iteration = (dw.iteration += weighted);
        for (var i = 0; i < w.length; ++i) accdw[i] += weighted * dw[i];
    }

    initialize(tensor, set, linked) {
        if (!tensor.initialized) { // general initialization
            tensor.dw.iteration = 0;
            tensor.dw.acc = new Float64Array(tensor.dw.length)
        }

        for (var i = 0; i < this.states.length; ++i) { // specific (algorithm dependent) initialization
            if (this.states[i] in tensor.dw)
                tensor.dw[this.states[i]] = tensor.dw[this.states[i]].fill(0.0)
            else
                tensor.dw[this.states[i]] = new Float64Array(tensor.dw.length)
        }

        tensor.initialized = true
    }

    static register(name, value) {
        Optim.methods[name] = value;
    }

}

Optim.methods = {};

Optim.register("sgd", {

    deliver(opt) {
        if (opt.momentum === 0) {
            return function() { dx = opt.rate * gij; }
        }

        return this.perform;
    },

    perform(mom) {
        dx = opt.rate * gij + opt.momentum * mom[i];
        mom[i] = dx;
    },

    options: {
        rate: 0.01,
        momentum: 0
    }

});

Optim.register("adadelta", {

    perform(gsum, xsum) {
        gsum[i] = opt.ro * gsum[i] + (1 - opt.ro) * gij * gij;
        dx = Math.sqrt((xsum[i] + opt.eps) / (gsum[i] + opt.eps)) * gij;
        xsum[i] = opt.ro * xsum[i] + (1 - opt.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
    },

    options: {
        ro: 0.95,
        eps: 1e-8
    }

});

Optim.register("adam", {

    perform(m, v) {
        m[i] = opt.beta1 * m[i] + (1 - opt.beta1) * gij; // update biased first moment estimate
        v[i] = opt.beta2 * v[i] + (1 - opt.beta2) * gij * gij; // update biased second moment estimate
        var bcm = m[i] / (1 - Math.pow(opt.beta1, iteration)); // correct bias first moment estimate
        var bcv = v[i] / (1 - Math.pow(opt.beta2, iteration)); // correct bias second moment estimate
        dx = opt.rate * bcm / (Math.sqrt(bcv) + opt.eps);
    },

    options: {
        rate: 0.01,
        eps: 1e-8,
        beta1: 0.9,
        beta2: 0.999
    }

});

Optim.INDEX = 0

module.exports = Optim;
