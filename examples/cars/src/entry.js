const CarDemo = require('./cardemo.js')

function createLossChart() {
    var data = {
        series: [[], []]
    };

    return new Chartist.Line('.ct-chart', data, {
        lineSmooth: Chartist.Interpolation.none()
    });
}

function boot() {
    const el = document.getElementById("container");
    const demo = new CarDemo(el);

    demo.world.chart = createLossChart();

    return demo;
};

const demo = boot();
window.demo = demo;

const ageTextEl = document.getElementById('agent-age');
function updateAge() {
    ageTextEl.innerText = Math.floor(demo.world.age) + '';
}

setInterval(updateAge, 450);
