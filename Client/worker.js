
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
	cost: 0,
	loss: 0,
	total: 0,
	totalTrained: 0,
	batches: 0,
	forward: function(graph, graphMats, batch) {
		var hiddens = utils.sigmoidLayer(graph, graphMats, batch.inputs, 'W1', 'b1')
		this.cost = utils.softmaxLayer(graph, graphMats, hiddens, batch.labels, 'W2', 'b2');
		this.totalTrained += 10;
		this.total += this.cost;
	},
	reportCost: function(cost) {
		this.loss += cost;
		this.batches += 1;
		if(this.batches >= 1000) {
			console.log(this.loss / this.batches);
			this.loss = 0;
			this.batches = 0;
		}
	},	
	params: {
		'W1': {
			'nr': 784,
			'nc': 10
		},
		'b1': {
			'nr': 10, 
			'nc': 1
		},
		'W2': {
			'nr': 10,
			'nc': 10
		},
		'b2': {
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
