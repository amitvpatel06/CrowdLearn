
var R = require('./rl.js'); 



function Master(socketServer, hyperparams, data, graphRep) {
	this.server = socketServer;
	this.data = data; 
	this.model = graphRep; 
	this.epochs = hyperparams.epochs || 2000;
	this.graphMats = {};
	this.accumulatedGrads = {};
	this.workers = {};
	this.ready = {}; 
	this.working = {}; 
	this.i = 0;
	this.mu = hyperparams.initMu;
	this.std = hyperparams.initStd;
	this.solver = new R.Solver();
	this.batchSize = hyperparams.batchSize || 10
	this.lr = hyperparams.lr || 0.01;
	this.regc = hyperparams.regularization || 0.00001;
	this.clip = hyperparams.clip || 5.0; 
}

var fillMat = function(input, mat) {
	for(var i = 0; i < input.length; i++) {
		for(var j = 0; j < input[0].length; j++) {
			mat.set(i, j, input[i][j]);
		}
	}
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
	json['step_cache'] = this.solver.step_cache; 
	json.id = socket.conn.id;
	socket.emit('weights', json);
}

Master.prototype.sendBatch = function(socket, batch) {
	socket.emit('batch', batch);
}

Master.prototype.addSocketCallBacks = function() {

	var updateWeights = function(data) {
		for(var mat in data.grads) {
			var toUpdate = this.graphMats[mat]; 
			this.i +=1;
			var update = data.grads[mat]; 
			for(var weight in toUpdate.w) {
				toUpdate[weight] -= update[weight]; 
			}
		}
		if(this.workers[data.id]) {
			console.log('worker');
			this.ready[data.id] = this.workers[data.id];
		}
	}
	var updateWeightscb = updateWeights.bind(this);
	

	var connect = function(socket) {
		this.ready[socket.conn.id] = socket; 
		this.workers[socket.conn.id] = socket; 
		socket.on('update', updateWeightscb);
		this.train(); 
	}
	var disconnect = function(socket) {
		var sid = socket.conn.id; 
		if(this.ready[sid]) {
			delete this.ready[sid];
		}
		if(this.workers[sid]) {
			delete this.workers[sid];
		}
		if(this.working[sid]) {
			delete this.working[sid];
		}
	}
	var connectcb = connect.bind(this);
	var disconnectcb = disconnect.bind(this);

	this.server.on('connect', connectcb);

	this.server.on('disconnect', disconnectcb);
}


Master.prototype.forward  = function(batch) {
	var inputs = {}
	for(var input in this.model.inputs) {
		inputs[input] = fillMat(batch[input], new R.Mat(this.model.inputSize, this.batchSize));
	}
	this.model.forward(this.graph, this.graphMats, inputs);
}
// Downpour SGD algorithm with RMS prop
Master.prototype.train = function() {
	var batchSize = this.batchSize;
	for(var i = 0; i < this.epochs; i++) {
		var idx = 0; 
		while(idx < this.data.train.length) {
			for(var worker in this.ready) {
				var batch = this.data.train.slice(idx, idx + this.batchSize);
				var socket = this.ready[worker];
				this.sendWeights(socket, batch)
				this.sendBatch(socket, batch);
				idx += batchSize;
				delete this.ready[worker]
				if(idx + batchSize > this.data.train.length) {
					break;
				}
			}
			if(idx + batchSize > this.data.train.length) {
				break;
			}
			var batch = this.data.train.slice(idx, idx + this.batchSize);
			this.forward(batch);
			this.graph.backward();
			this.graph.backprop = []; 
			idx += batchSize;
		}
	}
}

module.exports = Master; 