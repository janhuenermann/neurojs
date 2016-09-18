"use strict";

require('./math/statistics.js')

var neurojs = {

	Network: require('./network.js'),
	Agent: require('./rl/agent.js'),
	Optim: require('./optim.js'),
	Loader: require('./loader.js')

}

if (typeof window !== 'undefined') {
	window.neurojs = neurojs
} else {
	module.exports = neurojs
}
