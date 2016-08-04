
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
	this.solver = new R.Solver();
	this.batchSize = hyperparams.batchSize || 10
	this.lr = hyperparams.lr || 0.01;
	this.regc = hyperparams.regularization || 0.00001;
	this.clip = hyperparams.clip || 5.0; 
}


Worker.prototype.createModel = function(initial_message) {
	this.graphMats = {}; 
	for(var mat in initial_message.data) {
		var x = new R.Mat();
		x.fromJSON(initial_message.data[mat]);
		this.graphMats[mat] = x; 
	}
	this.solver.step_cache = initial_message.step_cache; 
	this.id = initial_message.id
}

Worker.prototype.train = function(batch) {
	var inputs = {}
	inputs = fillMat(batch, new R.Mat(this.batchSize,  this.model.inputSize));
	
	this.model.forward(this.graph, this.graphMats, inputs);
	this.graph.backward();
	for(var mat in this.graphMats) {
		this.accumulatedGradient[mat] = this.graphMats[mat].dw;
	}
	var json = {};
	json.grads = this.accumulatedGradient;
	json.id = this.id;
	this.socket.emit('update', json);
}


Worker.prototype.setUp =  function(url) {
	this.socket = io.connect(url);
	var create = function(message) {
		this.createModel(message);
	}

	var trainBatch = function(message) {
		this.train(message); 
	}

	create.bind(this);
	trainBatch.bind(this);

	this.socket.on('weights', create.bind(this));
	this.socket.on('batch', trainBatch.bind(this)); 
}

var graphRep = {
	forward: function(graph, graphMats, inputs) {
		var y = R.RandMat(1,1,0,1);
		y.set(0,0,1);
		var z = graph.add(y, graphMats['W']);
		for(var idx in z.dw){
			z.dw[idx] = 1;
		}
		console.log(graphMats);
	},
	params: {
		'W': {
			'nr': 1,
			'nc': 1
		}
	},
	inputSize: 1
}
var hyperparams = {
	initMu: 0,
	initStd: 1,
	batchSize: 2
}

var work = new Worker(graphRep, hyperparams);
work.setUp('http://localhost/'); 
