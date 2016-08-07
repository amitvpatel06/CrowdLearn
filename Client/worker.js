
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
	// vectorize inputs first
	var inputs = utils.fillMat(batch.inputs, new R.Mat(this.batchSize,  this.model.inputSize));
	batch.inputs = inputs;
	this.model.forward(this.graph, this.graphMats, batch);
	this.graph.backward();
	for(var mat in this.graphMats) {
		this.accumulatedGradient[mat] = this.graphMats[mat].dw;
	}
	var json = {};
	json.grads = this.accumulatedGradient;
	json.id = this.id;
	json.stop = batch.stop ? true : false;
	json.cost = this.model.cost;
	this.socket.emit('update', json);
	this.solver.step(this.graphMats, this.lr, this.regc, this.lr);
	this.graph.backprop = [];
}

Worker.prototype.sendRawData = function(data) {
	var raw = {
		data: data,
		id: this.id
	}
	this.socket.emit('raw', raw);
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
	total: 0,
	totalTrained: 0, 
	cost: 0,
	forward: function(graph, graphMats, batch) {
		var dot_prod = graph.mul(batch.inputs, graphMats['W']);
		var hiddens = utils.addBias(graph, graphMats['b'], dot_prod);
		var activations = utils.softmaxBatch(hiddens);
		this.cost = utils.softmaxBatchGrads(activations, hiddens, batch.labels);
		this.totalTrained += 10;
		this.total += this.cost;
		console.log(this.cost);
	},
	params: {
		'W': {
			'nr': 784,
			'nc': 10
		},
		'b': {
			'nr': 10, 
			'nc': 1
		}
	},
	startImmediately: true,
	inputSize: 784
}
var hyperparams = {
	lr: 0.01,
	initMu: 0,
	initStd: 1,
	batchSize: 10,
	epochs: 100,
	warmup: 1,
}

var work = new Worker(graphRep, hyperparams);
work.setUp('http://localhost/'); 
