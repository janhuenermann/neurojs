var neuro = require('../../src/framework.js');

var model = new neuro.Network.Model([
    { type: 'input', size: 2 },
    { type: 'fc', size: 10, activation: 'relu' },
    { type: 'fc', size: 10, activation: 'relu' },
    { type: 'fc', size: 1, activation: 'sigmoid' },
]);

model.numericalGradientCheck()

var config = model.newConfiguration()
var optim = config.useOptimizer({
	method: 'adadelta',
})

var state = config.newState()

console.time('nn');
var l = 0.0, correct = 0, loss = 0.0
for (var i = 0; i < 5e6; i++) {
	var a = Math.random()
	var b = Math.random()
	var y = (a > 0.5) != (b > 0.5);

	var outp = state.forward([ a, b ])
	l += loss = state.backward([ y ? 1 : 0 ])

	if ((outp > 0.5) === y)
		correct++

	config.optimize()

	if (i % 10000 === 0) {
		console.log('loss ' + l / 10000 + '; correct ' + correct + ' of 10000; iteration ' + i)
		l = 0.0
		correct = 0.0
	}
}
console.log(config.parameters)
console.timeEnd('nn')