# CrowdLearn

A Javascript client + server side system for doing distributed machine learning using browser windows! 

Developers can use this library to rapdily prototype, deploy, and train machine learning algorithms that can gather all of the massive amounts of data available in client-side interactions and use them to train a single model on the fly. This eliminates the work of gathering, storing, and preprocessing log data and then feeding it to a machine learning model. It can also be used to train models on datasets already on a server by farming out the computations to many different clients, which can execute them in parallel. 

<h1>What does that mean?</h1>

CrowdLearn allows users to write and train machine learning algorithms in JavaScript with both client and server-side libraries using a popular distributed optimization algorithm: Downpour Stochastic Gradient Descent. Traditionally used only in high performance computing clusters for training massive models, Downpour Stochastic gradient trains a machine learning model(usually a neural network) by using a central master sever for distributing data shards to worker nodes to train the model on and then applying the accumulated gradient updates to a central parameter store, all while keeping the model weights in sync across the nodes.  CrowdLearn implements this algorithm for web by treating a central server as the master and creating worker side nodes on the client side. It then uses websockets(SocketIO) to implement the downpour algorithm! It also allows worker nodes to gather contextual information from things like user interactions with the webpage, send it to the server for preprocessing, and then train a model on it immediately and asynchronously. 

<h1>How does the API work?</h1>
Neural networks and other graphical models are very easy to write in CrowdLearn. The library centers around 3 classes: Master, Worker, and GraphRep. 

First, set up a SocketIO server: 

```javascript
var io = require('socket.io')(server);
```

Use GraphRep to specify your neural model(in this case a simple 2 layer net for MNIST digit classification):

```javascript
var graphRep = {
	updateWorkerCount:100,
	cost: 0,
	loss: 0,
	total: 0,
	batches: 0,
	forward: function(graph, graphMats, batch) {
		var hiddens = utils.sigmoidLayer(graph, graphMats, batch.inputs, 'W1', 'b1')
		this.cost = utils.softmaxLayer(graph, graphMats, hiddens, batch.labels, 'W2', 'b2');
	},
	reportCost: function(cost) {
		this.loss += cost;
		this.batches += 1;

		if(this.batches >= 100) {
			console.log(this.loss / this.batches);
			this.loss = 0;
			this.batches = 0;
		}
	},	
	params: {
		'W1': {
			'nr': 784,
			'nc': 100
		},
		'b1': {
			'nr': 100, 
			'nc': 1
		},
		'W2': {
			'nr': 100,
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
```

You must specify: the model parameters and their dimensions(including input size), what a forward pass of the model does(i.e the prediction procedure using the underlying graph, the underlying params, and an input batch), and how you want to report costs(appending any revelant variables to this.cost). The rest of the parameters are optional and have default values. Next you specify model hyperparameters(they all have defaults but you can specify all of the following):

```javascript
var hyperparams = {
	lr: 0.01, // Learning Rate
	initMu: 0, // For parameter initialization
	initStd: 1, 
	batchSize: 100,
	epochs: 10,
	warmup: 10,
	regularization: 0.00001,
	clip: 5.0 // for gradient size clipping
}
```
Finally, you construct a data set(outting inputs and labels in the correct categories): 
```javascript
var set = mnist.set(10000, 1);
var data = {};
data.labels = [];
data.inputs = [];
for(var j in set.training) {
	data.inputs.push(set.training[j].input);
	data.labels.push(set.training[j].output);
}
```
Now you have everything you need to build a model!
Masters need all of these things to build and workers need just the graphRep and the hyperparams:
```javascript
var master = new Master(io, graphRep, hyperparams, data);
var worker = new Worker(graphRep, hyperparams);
```
All you need to get started are the contents of the Server/Javascript and the Client folders(the tensorflow version is still under construction). I use a chrome extension to inject my workers into webpages, but any delivery method that embeds the dependencies of the worker(the libarary utils, recurrentjs, and SocketIO) in a page works! Similarly, any server implementation that uses master.js and has utils.js, recurrentjs, and SocketIO available is workable. 

