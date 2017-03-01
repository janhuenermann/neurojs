# neurojs
neurojs is a JavaScript framework for deep learning in the browser. It mainly focuses on reinforcement learning, but can be used for any neural network based task. It contains neat demos to visualise these capabilities, for instance a 2D self-driving car. 

Feel free to contribute. I appreciate any support, because frankly this is a big project to maintain!

![](examples/cars/images/screenshot.png)

### Features
- Implements a full-stack neural-network based machine learning framework
- Extended reinforcement-learning support
	+ Uniform and prioritised replay buffers
	+ Advantage-learning (increasing the action-gap) https://arxiv.org/pdf/1512.04860v1.pdf
	+ Support for **deep-q-networks** and **actor-critic** models (via deep-deterministic-policy-gradients)
- Binary import and export of network configurations (weights etc.)
- High-performance

### Examples
- [Self-driving car](/examples/cars)
- [Advanced XOR](/examples/adv-xor)
- [Andrej Karpathy's Waterworld](/examples/waterworld) (ConvNetJS replaced with NeuroJS)

### Running the examples
```bash
npm install
npm start
```

Open `http://localhost:8080/examples/` in your browser and select the demo you want to run.

### Future
- More examples (pong, improved cars, etc.)
- Support for web workers
- LSTM and backpropagation through time
