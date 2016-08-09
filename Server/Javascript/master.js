
var R = require('./rl.js'); 


// helper functions
var fillMat = function(input, mat) {
	for(var i = 0; i < input.length; i++) {
		for(var j = 0; j < input[0].length; j++) {
			mat.set(i, j, input[i][j]);
		}
	}
}

// Coming soon: addons for rljs(new functions for the graph class so it can do more things)


// Main code 
function Master(socketServer, hyperparams, data, graphRep) {
	this.server = socketServer;
	this.data = data; 
	this.model = graphRep; 
	this.hyperparams = hyperparams
	this.epochs = hyperparams.epochs || 20;
	this.graphMats = {};
	this.workers = {};
	this.updateCounter = {}; 
	this.idx = 0;
	this.update = graphRep.updateWorkerCount || 1;
	this.mu = hyperparams.initMu;
	this.std = hyperparams.initStd;
	this.solver = new R.Solver();
	this.batchSize = hyperparams.batchSize || 10;
	this.lr = hyperparams.lr || 0.01;
	this.regc = hyperparams.regularization || 0.00001;
	this.clip = hyperparams.clip || 5.0; 
}


Master.prototype.createGraph = function() {
	this.graph = new R.Graph(); 
	for(var name in this.model.params){
		var node = this.model.params[name];
		this.graphMats[name] = new R.RandMat(node.nr, node.nc, this.mu, this.std);
	}
}

Master.prototype.sendWeights = function(socket) {
	var json = {};
	json.data = {};
	for(var mat in this.graphMats) {
		json.data[mat] = this.graphMats[mat].toJSON();
	}
	json.step_cache = this.solver.step_cache; 
	json.id = socket.conn.id;
	socket.emit('weights', json);
}

Master.prototype.incrementUpdateCounter = function() {
	for(var socket in this.updateCounter) {
		this.updateCounter[socket] += 1; 
	}
}

Master.prototype.sendBatch = function(socket, batch) {
	socket.emit('batch', batch);
}

Master.prototype.addSocketCallBacks = function() {
	var updateWeights = function(data) {
		for(var mat in data.grads) {
			var toUpdate = this.graphMats[mat]; 
			var update = data.grads[mat]; 
			for(var weight in toUpdate.dw) {
				toUpdate.dw[weight] = update[weight]; 
			}
		}
		this.solver.step(this.graphMats, this.lr, this.regc, this.lr);
		this.incrementUpdateCounter();
		this.model.reportCost(data.cost);
		if(this.updateCounter[data.id] >= this.update) {
			this.sendWeights(this.workers[data.id]);
			this.updateCounter[data.id] = 0; 
		}
		if(!data.stop) {
			var inputs = this.data.inputs.slice(this.idx, this.idx + this.batchSize);
			var labels = this.data.labels.slice(this.idx, this.idx + this.batchSize);
			var batch = {
				inputs: inputs,
				labels: labels
			}
			this.idx += this.batchSize
			if(this.idx + this.batchSize > this.data.inputs.length) {
				this.idx = 0
				this.epochs = this.epochs - 1;
			}
			if(this.epochs <= 0) {
				console.log(new Number(new Date()))
				console.log('done')
				return; 
			}
			this.sendBatch(this.workers[data.id], batch);
		}
	}

	var updateWeightscb = updateWeights.bind(this);

	var preProcess = function(raw) {
		console.log(raw);
		var batch = this.model.preProcess(raw.data);
		batch.stop = true;
		this.sendBatch(this.workers[raw.id], batch);
	}
	var preProcesscb = preProcess.bind(this);

	var connect = function(socket) {
		this.workers[socket.conn.id] = socket; 
		this.updateCounter[socket.conn.id] = 0; 
		this.sendWeights(socket)
		socket.on('update', updateWeightscb);
		socket.on('raw', preProcesscb);
		if(this.model.startImmediately) {
			var inputs = this.data.inputs.slice(this.idx, this.idx + this.batchSize);
			var labels = this.data.labels.slice(this.idx, this.idx + this.batchSize);
			var batch = {
				inputs: inputs,
				labels: labels
			}
			this.idx += this.batchSize
			if(this.epochs <= 0) {
				return; 
			}
			this.sendBatch(socket, batch);
		}
	}

	var disconnect = function(socket) {
		var sid = socket.conn.id; 
		if(this.workers[sid]) {
			delete this.workers[sid];
		}
		if(this.updateCounter[sid]) {
			delete this.updateCounter[sid];
		}
	}

	var connectcb = connect.bind(this);
	var disconnectcb = disconnect.bind(this);

	this.server.on('connect', connectcb);
	this.server.on('disconnect', disconnectcb);
}


Master.prototype.forward  = function(batch) {
	// vectorize inputs first
	var inputs = fillMat(batch.inputs[input], new R.Mat(this.batchSize, this.model.inputSize));
	batch.inputs = inputs
	this.model.forward(this.graph, this.graphMats, batch);
}

// Warmup Trainer
Master.prototype.train = function() {
	var batchSize = this.batchSize;
	for(var i = 0; i < this.hyperparams.warmup; i++) {
		var idx = 0; 
		while(idx < this.data.inputs.length) {
			var inputs = this.data.inputs.slice(idx, idx + this.batchSize);
			var labels = this.data.labels.slice(this.idx, this.idx + this.batchSize);
			var batch = {
				inputs: inputs,
				labels: labels
			}
			this.forward(batch);
			this.graph.backward();
			this.graph.backprop = []; 

			idx += batchSize

			if(idx + batchSize > this.data.inputs.length) {
				break;
			}
		}
	}
	console.log('done warming up')
}

module.exports = Master; 