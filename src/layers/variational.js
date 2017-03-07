"use strict";

var Size = require('../math/size.js');

function sigm(x) {
    return 1 / (1 + Math.exp(-x))
}

function dsigm(fx) {
    return fx * (1.0 - fx)
}

class VariationalLayer {

    constructor(input, opt) {
        if (input.length % 2 !== 0) {
            throw 'input must be divisible by two.'
        }

        this.dimensions = {
            input: input,
            output: new Size(1, 1, input.length / 2),
            parameters: 0
        }

        this.storage = {
            samples: this.dimensions.output.length
        }

        this.variance_decay = opt.variance_decay || 0.0
        
    }

    forward(ctx) {
        var Y = this.dimensions.output.length
        var inpw = ctx.input.w, outw = ctx.output.w
        var samples = ctx.samples

        for (var i = 0; i < Y; i++) {
            var eps = Math.randn(0.0, 1.0)
            outw[i] = inpw[2 * i + 0] + inpw[2 * i + 1] * eps
            samples[i] = eps
        }
    }

    backward(ctx) {
        var Y = this.dimensions.output.length
        var inpw = ctx.input.w, outw = ctx.output.w
        var inpdw = ctx.input.dw, outdw = ctx.output.dw
        var samples = ctx.samples

        for (var i = 0; i < Y; i++) {
            inpdw[2 * i + 0] += outdw[i]
            inpdw[2 * i + 1] += samples[i] * outdw[i]
        }
    }

}


class VariationalBinaryLayer {

    constructor(input, opt) {
        this.dimensions = {
            input: input,
            output: new Size(1, 1, input.length),
            parameters: 0
        }

        this.storage = {
            probs: this.dimensions.output.length
        }
        
    }

    forward(ctx) {
        var Y = this.dimensions.output.length
        var inpw = ctx.input.w, outw = ctx.output.w
        var probs = ctx.probs

        for (var i = 0; i < Y; i++) {
            var eps = Math.random()
            probs[i] = sigm(inpw[i]) // activate with probability
            outw[i] = eps <= probs[i] ? 1.0 : 0.0
        }
    }

    backward(ctx) {
        var Y = this.dimensions.output.length
        var inpw = ctx.input.w, outw = ctx.output.w
        var inpdw = ctx.input.dw, outdw = ctx.output.dw
        var probs = ctx.probs

        for (var i = 0; i < Y; i++) {
            inpdw[i] = dsigm( probs[i] ) * outdw[i]
        }
    }

}


module.exports = {
    VariationalBinaryLayer
}