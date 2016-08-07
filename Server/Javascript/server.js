var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var R = require('./rl.js');
var Master = require('./master.js');
var utils = require('./utils.js');
var mnist = require('mnist');

var graphRep = {
	forward: function(graph, graphMats, batch) {
		var dot_prod = graph.mul(batch.inputs, graphMats['W']);
		var hiddens = utils.addBias(graph, graphMats['b'], dot_prod);
		var activations = utils.softmaxBatch(hiddens);
		var cost = utils.softmaxBatchGrads(activations, hiddens, batch.labels);
		console.log(cost);
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
