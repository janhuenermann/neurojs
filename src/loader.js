class WebLoader {

    static load(path, completion) {
        var request = new XMLHttpRequest()
        request.open("GET", path, true)
        request.responseType = "arraybuffer"
        request.addEventListener('load', function(e) {
            completion(request.response)
        })

        request.send(null)
    }

    static loadConfig(path, model, completion) {
    	var config = model.newConfiguration()
    	WebLoader.loadConfigInto(path, config, completion.bind(null, config))
    }

    static loadConfigInto(path, config, completion) {
        WebLoader.load(path, function (buffer) {
            var weights = new Float64Array(buffer)
            config.read(weights)
            completion()
        })
    }


    static loadAgent(path, agent, completion) {
        agent.ready = false

        WebLoader.load(path, function (buffer) {
            var weights = new Float64Array(buffer)
            agent.import(weights)
            agent.ready = true

            if (completion)
                completion(agent)
        })
    }

}

module.exports = WebLoader