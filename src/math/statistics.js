if (Float64Array.prototype.fill === undefined)
    Float64Array.prototype.fill = function (v) {
        for (var i = 0; i < this.length; i++) { this[i] = v; }
    };


Object.assign(Math, {

    statistics: true,

    randn() {
        var U1, U2 = this.randn.U2, W, mult;
        if (U2) {
            this.randn.U2 = null; // deactivate for next time
            return U2;
        }

        do {
            U1 = -1 + this.random() * 2;
            U2 = -1 + this.random() * 2;
            W = U1 * U1 + U2 * U2;
        } while (W >= 1 || W === 0);

        mult = Math.sqrt(-2 * Math.log(W) / W);
        this.randn.U2 = U2 * mult;

        return U1 * mult;
    },

    randf(a, b) {
        return this.random() * (b - a) + a;
    },

    randi(a, b) {
        return a + Math.floor(Math.random() * (b - a))
    },

    uhlenbeckOrnstein(old, theta, sigma, dt) {
       return old - theta * old * dt + Math.sqrt(dt) * Math.randn(0.0, sigma)
    }

})

Object.assign(Array, {

    random(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    },

    randomAndRemove() {
        var index = Math.floor(Math.random() * this.length)
        var value = this[index]
        this.splice(index, 1)

        return value
    },

    sum(arr, valueFunc) {
        valueFunc = valueFunc || (x => x);
        var sum = 0.0
        for (var i = 0; i < arr.length; i++) {
            sum += valueFunc(arr[i])
        }

        return sum
    },

    lowest(valueFunc) {
        return this.reduce((a, b) => valueFunc(a) < valueFunc(b) ? a : b)
    },

    highest(valueFunc) {
        return this.reduce((a, b) => valueFunc(a) > valueFunc(b) ? a : b)
    },

    sample(probFunc) {
        var des = Math.random()
        var pos = 0.0
        for (var i = 0; i < this.children.length; i++) {
            if (des < (pos += prob[i]))
                return this.children[i]
        }

        return this.children[this.children.length - 1]
    }

})


Object.assign(Float64Array, {

    filled(n, v) {
        return (new Float64Array(n)).fill(v)
    },

    oneHot(n, N) {
        var vec = new Float64Array(N)
        vec[n] = 1.0
        return vec
    },

    noise(N, a, b) {
        var vec = new Float64Array(N)
        vec.randf(a || -1, b || 1)
        return vec
    }

});


Object.assign(Float64Array.prototype, {

    randn(mu, std) {
        for (var i = 0; i < this.length; i++) { this[i] = mu + std * Math.randn(); }
    },

    randf(a, b) { 
        for (var i = 0; i < this.length; i++) { this[i] = Math.randf(a, b); }
    },

    maxi() {
        var maxv = -Infinity, maxi = 0.0
        for (var i = 0; i < this.length; i++) {
            if (this[i] > maxv) {
                maxv = this[i]; maxi = i
            }
        }

        return maxi
    },

    clone() {
        var copied = new Float64Array(this.length)
        copied.set(this)
        return copied
    },

    diff(x, y) {
        for (var i = 0; i < this.length; i++) { this[i] = x[i] - y[i] }
    },

    add(x, y) {
        for (var i = 0; i < this.length; i++) { this[i] = x[i] + y[i] }
    },

    mult(x, y) {
        for (var i = 0; i < this.length; i++) { this[i] = x[i] * y }
    }

});

