"use strict";

if (!require('./util/support.js')()) {
	throw 'env unsupported';
}

require('./math/statistics.js')

var neurojs = {

	Network: require('./network.js'),
	Agent: require('./rl/agent.js'),
	Optim: require('./optim.js'),
	Loader: require('./loader.js'),
	Buffers: require('./rl/replay-buffers.js'),
	NetOnDisk: require('./storage.js'),
	FileLoader: require('./util/downloader.js'),
	Binary: require('./util/file.js'),
	Shared: require('./shared.js')

}

if (typeof window !== 'undefined') {
	window.neurojs = neurojs
} else {
	module.exports = neurojs
}
