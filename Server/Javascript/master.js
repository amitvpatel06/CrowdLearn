
var rl = require('./rl.js'); 



function Master(socketServer, hyerparams, data, graphRep) {
	this.server = socketServer;
	this.data = data; 
	this.model = graphRep; 
	this.epochs = hyerparams.epochs || 10;
	this.RL = isRL; 
	this.graphMats = {};
	this.accumulatedGrads = {};
	this.ready = {}; 
	this.working = {}; 
	this.mu = hyperparams.initMu;
	this.std = hyperparams.initStd;
	this.solver = new R.Solver();
	this.batchSize = hyperparams.batchSize || 10
	this.lr = hyerparams.lr || 0.01;
	this.regc = hyerparams.regularization || 0.00001;
	this.clip = hyerparams.clip || 5.0; 
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
	var json = {}
	for(var mat in this.graphMats) {
		json[mat] = this.graphMats[mat].toJSON();
	}
	socket.emit('weights', json);
}

Master.prototype.sendBatch = function(socket, batch) {
	socket.emit('batch', batch.toJSON());
}

Master.prototype.addSocketCallBacks = function(isUpdate) {
	if(isUpdate) {
		this.server.on('update', function(update) {
			for(var mat in update) {
				var toUpdate = this.graphMats[update]; 
				var update = update[mat]; 
				for(var weight in toUpdate.w) {
					toUpdate[weight] -= update[weight]; 
				}
			}
		})
	}
	else{
		console.log("feature not yet available")
	}
	var connect = function(socket) {
		this.ready[socket.conn.id] = socket; 
	}
	var disconnect = function(socket) {
		var sid = socket.conn.id; 
		if(this.ready[sid]) {
			delete this.ready[sid];
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


Master.prototype.forward  = function(batch){
	var inputs = {}
	for(var input in this.graphRep.inputs) {
		inputs[input] = fillMat(batch[input], new R.Mat(this.graphRep.inputSize, this.batchSize));
	}
	this.graphRep.forward(this.graph, this.graphMats, inputs);
}

Master.prototype.train = function() {
	for(var i = 0; i < this.epochs; i++) {
		var idx = 0; 
		while(idx < this.data.train.length) {

			for(var worker in this.ready) {
				var batch = this.data.train.slice(idx, idx + this.batchSize);
				var socket = this.ready[worker];
				this.sendWeights(socket);
				this.sendBatch(socket, batch);
				idx += batchSize;
				if(idx + batchSize > this.data.train.length) {
					break;
				}
			}
			var batch = this.data.train.slice(idx, idx + this.batchSize);
			this.forward(batch)
			this.solver.step(this.model, this.lr, this.regc, this.clip); 
		}
	}
}