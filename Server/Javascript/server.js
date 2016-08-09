var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var R = require('./rl.js');
var Master = require('./master.js');
var utils = require('./utils.js');
var mnist = require('mnist');

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

var set = mnist.set(10000, 1);
var data = {};
data.labels = [];
data.inputs = [];
for(var j in set.training) {
	data.inputs.push(set.training[j].input);
	data.labels.push(set.training[j].output);
}


server.listen(80);
var test = new Master(io, hyperparams, data, graphRep); 
test.createGraph();

var time = new Number(new Date())
test.addSocketCallBacks()
console.log(new Number(new Date()))

app.get('/', function (req, res) {
  res.send("hello");
});
