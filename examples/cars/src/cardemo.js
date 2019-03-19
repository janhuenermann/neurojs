const app = require('./index.js');

class CarDemo {

    constructor (element) {
        this.root = element

        // now to the more interesting part
        this.world = new app.world()
        this.renderer = new app.renderer(this.world, element)

        this.world.init(this.renderer)
        this.world.populate(4) // --- how many cars

        this.dispatcher = new app.dispatcher(this.renderer, this.world);
        this.dispatcher.begin()

        this.root.classList.add('booted')
        this.setLearning(false)
    }

    save() {
        const actorBuf = this.world.agents[0].brain.export();
        const worldBuf = this.world.export();
        const fusedBuf = neurojs.Binary.Writer.write([worldBuf, actorBuf]);
        downloadFile(new DataView(fusedBuf), "agent.bin");
    }

    load(event) {
        var input = event.target;

        var reader = new FileReader();
        reader.onload = () => {
            const buffer = reader.result
            this.import(buffer);
        };

        reader.readAsArrayBuffer(input.files[0]);
    }

    import (buffer) {
        var imported = neurojs.Binary.Reader.read(buffer)

        this.importEnv(imported[0])
        this.importBrain(imported[1]) 
    }

    importEnv (buffer) {
        this.world.import(buffer)
    }

    importBrain (buffer) {
        var imported = neurojs.NetOnDisk.readMultiPart(buffer)
        this.world.initialiseAgents(imported.actor, null)
        this.dispatcher.begin()
    }

    setLearning(learning) {
        for (var i = 0; i <  this.world.agents.length; i++) {
            this.world.agents[i].brain.learning = learning
        }
    
        this.world.plotRewardOnly = !learning
    }

}

function downloadFile(dv, name) {
    var a;
    if (typeof window.downloadAnchor == 'undefined') {
        a = window.downloadAnchor = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
    } else {
        a = window.downloadAnchor
    }

    var blob = new Blob([dv], { type: 'application/octet-binary' }),
        tmpURL = window.URL.createObjectURL(blob);

    a.href = tmpURL;
    a.download = name;
    a.click();

    window.URL.revokeObjectURL(tmpURL);
    a.href = "";
}

module.exports = CarDemo;

