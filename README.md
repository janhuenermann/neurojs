![](examples/cars/images/screenshot.png)

# neurojs - A machine learning framework for browsers
- Implements a full-stack neural-network based machine learning framework
- Extended reinforcement-learning support
	+ Uniform and prioritised replay buffers
	+ Advantage-learning (increasing the action-gap) https://arxiv.org/pdf/1512.04860v1.pdf
	+ Support for **deep-q-networks** and **actor-critic** models (via deep-deterministic-policy-gradients)
- Binary import and export of network configurations (weights etc.)
- High-performance

Feel free to contribute. I appreciate any support, because frankly this is a big project to maintain!

## Examples
- [Self-driving car](/examples/cars)
- [Advanced XOR](/examples/adv-xor)
- [Andrej Karpathy's Waterworld](/examples/waterworld) (ConvNetJS replaced with NeuroJS)

## Blog post
I wrote a blog post about this framework with an interactive car-demo embeded [on my blog](http://lab.janhuenermann.de/article/learning-to-drive#car-container), check it out!

## Future
- Support for web workers
- LSTM and backpropagation through time
