var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var R = require('./rl.js');
var Master = require('./master.js');
var graphRep = {
	forward: function(graph, graphMats, inputs) {
		var y = R.RandMat(1,1,0,1);
		y.set(0,0,1);
		var z = graph.add(y, graphMats['W']);
		for(var idx in z.dw){
			z.dw[idx] = 1;
		}
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
var data = {
	'train': [[1], [1]]
}
var test = new Master(io, hyperparams, data, graphRep); 
test.createGraph();
test.addSocketCallBacks();

server.listen(80);

app.get('/', function (req, res) {
  res.send("hello");
});
