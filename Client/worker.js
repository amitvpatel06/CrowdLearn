
var fillMat = function(input, mat) {
	for(var i = 0; i < input.length; i++) {
		for(var j = 0; j < input[0].length; j++) {
			mat.set(i, j, input[i][j]);
		}
	} 
}

function Worker(graphRep, hyperparams) {
	this.accumulatedGradient = {}; 
	this.model = graphRep;
	this.graph = new R.Graph();
	this.solver = new R.solver();
	this.batchSize = hyperparams.batchSize || 10
	this.lr = hyerparams.lr || 0.01;
	this.regc = hyerparams.regularization || 0.00001;
	this.clip = hyerparams.clip || 5.0; 
}


Worker.prototype.createModel = function(initial_message) {
	this.graphMats = {}; 
}

Worker.prototype.train = function(batch) {
	var inputs = {}
	for(var input in this.graphRep.inputs) {
		inputs[input] = fillMat(batch[input], new R.Mat(this.graphRep.inputSize, this.batchSize));
	}
	this.graphRep.forward(this.graph, this.graphMats, inputs);
	this.graph.backward();
	for(var mat in this.graphMats) {
		this.graph.accumulatedGradient[mat] = this.graphMats[mat].dw;
	}
}


Worker.prototype.setUp =  function(url) {
	this.socket = io.connect(url);
	var create = function(message) {
		this.createModel(message);
		this.socket.emit('update', this.accumulatedGradient);
	}

	var trainBatch = function(message) {
		this.train(message.data); 
	}

	create.bind(this);
	trainBatch.bind(this);

	this.socket.on('weights', create);
	this.socket.on('batch', trainBatch); 

},


