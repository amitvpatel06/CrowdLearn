var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var R = require('./rl.js');
var Master = require('./master.js');

var fillMat = function(input, mat) {
	for(var i = 0; i < input.length; i++) {
		for(var j = 0; j < input[0].length; j++) {
			mat.set(i, j, input[i][j]);
		}
	}
}

var graphRep = {
	forward: function(graph, graphMats, batch) {
		var inputs = batch.inputs; 
		for(var i = 0; i < 100000000; i++){
			var j = 2 * 2.09;
		}
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
	batchSize: 2,
	epochs: 100,
	warmup: 100,
}
var data = {
	'train': [[1], [1], [2], [2], [3], [3], [4], [4], [5], [5], [6], [6]],
	'labels': [[1], [1], [2], [2], [3], [3], [4], [4], [5], [5], [6], [6]]
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
