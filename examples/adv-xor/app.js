var neuro = require('../../src/framework.js');
var fs = require('fs');

console.log('******* DESCRIPTION *******')

console.log('This is the advanced XOR demo')
console.log('Instead of learning the XOR problem in the traditional way')
console.log('this network learns XOR by doing the operation on the booleans')
console.log('a > 0.5 != b > 0.5')
console.log('Thus the demo has to show very precise')
console.log('differentiation between say 0.51 and 0.49')

console.log('*******  *******')
console.log('')
console.log('')

var file = './checkpoint.bin', model = null, config = null
if (fs.existsSync(file)) {
	var arr = (new Uint8Array(fs.readFileSync(file))).buffer
	
	config = neuro.NetOnDisk.read(arr)
	model = config.model

	console.log(('Read network from "' + file + '"').blue.bold)
}

else {
	model = new neuro.Network.Model([
	    { type: 'input', size: 2 },
	    { type: 'fc', size: 20, activation: 'relu' },
	    { type: 'fc', size: 20, activation: 'relu' },
	    { type: 'fc', size: 1, activation: 'sigmoid' },
	]);
	
	config = model.newConfiguration()

	console.log('Created new network'.blue.bold)
}

var optim = config.useOptimizer({
	method: 'adadelta'
})

var state = config.newState()


function draw() {
	return 4 * (Math.random() - 0.5) ** 3 + 0.5 // prefers random values near 0.5
}


console.time('nn')
var l = 0.0, correct = 0, loss = 0.0
for (var i = 0; i < 1e6; i++) {
	var a = draw()
	var b = draw()
	var y = (a > 0.5) != (b > 0.5)

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


console.log('')
console.log('Test results'.blue.bold)

for (var i = 0; i < 20; i++) {
	var a = draw()
	var b = draw()
	var c = state.forward([a, b])

	console.log('A: ' + ('' + a).red + ' \tB: ' + ('' + b).red + '\t\t' + 'OUT: ' + ('' + c).magenta)
}

var netBuffer = neuro.NetOnDisk.write(config)
fs.writeFile(file, Buffer.from(netBuffer), { flag: 'w' }, (err) => {
	if (err) console.log(err);
	else console.log(('Successfully saved network to "' + file + '"').green)
});

console.timeEnd('nn')