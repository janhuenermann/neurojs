var binary = require('./util/file.js');
var network = require('./network.js');

class NetOnDisk {

	static write(config) {
		var contents = [];

		contents.push(config.model.representation)
		contents.push(config.pullWeights())

		return binary.Writer.write(contents)
	}

	static read(buffer) {
		var contents = binary.Reader.read(buffer)

		var model = new network.Model(contents[0])
		var config = model.newConfiguration()

		config.putWeights(contents[1])

		return config
	}



	static writeMultiPart(list) {
		var contents = [];

		contents.push(Object.keys(list))

		for (var name in list) {
			var config = list[name]

			if (!config instanceof network.Configuration) {
				throw 'config in list must be of type Network.Configuration'
			}

			contents.push(name)
			contents.push(config.model.representation)
			contents.push(config.pullWeights())
		}

		return binary.Writer.write(contents)
	}

	static readMultiPart(buffer) {
		var contents = binary.Reader.read(buffer)

		var ptr = -1
		var names = contents[++ptr]

		var list = {}

		for (var i = 0; i < names.length; i++) {
			var name = names[i]

			if (contents[++ptr] !== name) {
				throw 'name does not match up'
			}

			var model = new network.Model(contents[++ptr])
			var config = model.newConfiguration()

			config.putWeights(contents[++ptr])

			list[name] = config
		}

		return list
	}

}

module.exports = NetOnDisk