"use strict";

class OutputLayer {

	constructor(inp, opt) {
        this.dimensions = {
            input: inp,
            output: inp,
            parameters: 0
        };

        this.output = true
    }

    result(ctx) {
        return ctx.output.w.clone()
    }


}

class SoftmaxLayer extends OutputLayer {

	forward(ctx) {
		var X = this.dimensions.input.length
		var inpw = ctx.input.w, outw = ctx.output.w
		var inpmax = -Infinity

		for (var i = 0; i < X; ++i)
			if (inpw[i] > inpmax) inpmax = inpw[i]

		var expsum = 0.0
		for (var i = 0; i < X; ++i)
			expsum += outw[i] = Math.exp(inpw[i] - inpmax)

		for (var i = 0; i < X; ++i)
			outw[i] /= expsum
    }

    backward(ctx) {
        var X = this.dimensions.input.length
        var inpdw = ctx.input.dw
        var outdw = ctx.output.dw, outw = ctx.output.w

        for (var i = 0; i < X; i++) {
            var sum = outw[i] * (1 - outw[i]) * outdw[i]

            for (var j = 0; j < X; j++) {
                if (i !== j)  sum -= outw[j] * outw[i] * outdw[j]
            }

            inpdw[i] = sum
        }
    }

    loss(ctx, desired, target) {
        return -Math.log(ctx.output.w[desired]) 
    }

    toGradientVector(desired, actual, out) {
        if (Number.isInteger(desired) !== true || desired >= this.size)
            throw 'target must be class index in softmax'

        for (var i = 0; i < this.size; i++) {
            out[i] = actual[i] - (desired === i ? 1.0 : 0.0)
        }
    }

}

class RegressionLayer extends OutputLayer {

    constructor(inp, opt) {
        super(inp, opt)
        this.passthrough = true
    }

    loss(ctx, desired) {
        var loss = 0.0
        var grads = this.toGradientVector(desired, ctx.output.w)

        for (var i = 0; i < this.dimensions.input.length; i++) {
            loss += 0.5 * grads[i] * grads[i]
        }

        return loss
    }

    toGradientVector(desired, actual, out) {
        var X = this.dimensions.input.length

        if (out === undefined) {
            out = new Float64Array(X)
        }

        // target is maximizing argmax, set n-th value to 1, rest to 0
        if (X > 1 && !isNaN(desired) && Number.isInteger(desired) && desired < X) {
            for (var i = 0; i < X; ++i) {
                out[i] = actual[i] - (i === desired ? 1.0 : 0.0)
            }
        }

        // single value output
        else if (X === 1 && !isNaN(desired)) {
            out[0] = actual[0] - desired
        }

        else if (desired instanceof Array || desired instanceof Float64Array) {
            for (var i = 0; i < out.length; ++i) {
                out[i] = actual[i] - desired[i]
            }
        }

        else {
            throw 'invalid target'
        }

        return out
    }

}

module.exports = {
    RegressionLayer, SoftmaxLayer
};
