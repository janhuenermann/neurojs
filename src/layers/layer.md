# Layer
A layer is a micro calculation in a network. It takes an input and returns an output. 

## Specifications

### Input/Output Requirements
Each layers is required to specify input and output size as well as parameter count. This is done via the dimensions property. 
The layer may specify null as size if there is no input/output/parameter.

```js
constructor(inp, opt) {
	this.dimensions = {
		input: null,
		output: M.Size.derive(opt.size),
		parameters: null
	};
}
```

### forward(input, output, parameters) ###
Updates the value vector of tensor `output` from data of tensor `input` with regard to tensor `parameters`.

Example of sigmoid forward function:
```js
forward(input, output, params) {
	var X = this.dimensions.input.length;
	var inpw = input.w, outw = output.w;

	for (var i = 0; i < X; i++) {
		outw[i] = 1 / (1 + Math.exp(-inpw[i]));
	}
}
```

### backward(input, output, parameters) ###
Updates the gradient vector of tensor `input` and tensor `parameters` with regard to tensor `output`.

### initialize(parameters) ###
Set initial parameters.

### States
Each layer is able to require any number of additional state-specific vectors. Through the property `state` on each layer, the layer may specify name-size-pairs, which determine name as well as size of these additional vectors. Finally the vectors are available through each output tensor.

Example:
```js
constructor() {
	this.state = {
		storage: new M.Size(1, 1, 100)
	};
}

forward(input, output, params) {
	output.storage[99] = 100;
}
```