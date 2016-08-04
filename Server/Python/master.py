import tensorflow as tf
import socketio
import eventlet
import json
import threading

## GraphRep represents the API any model you feed Master must satisfy
class GraphRep: 

	def __init__(self, **hyperparams):
		# implement any set up you need!, probably using hyper parameters dict as kwargs

	def construct_model(self):
		# implement a model using tensorflow API

	def train_batch(self, batch):
		# give back the loss operation for this model

	@property
	def params(self):
		return [v for v in tf.trainable_variables()]

	
 
class Master:

	def __init__(self, socket_server, data, graphRep, epochs, is_update, hyperparams): 
		self.socket = socket_server
		self.data = data
		self.model = graphRep	
		self.construct_graph()
		self.epochs = epochs
		self.ready_connections = {}
		self.working_connections = {}
		self.current_state = {}
		self.bind_socket_cbs()
		self.hyperparams = hyperparams
		self.trainer = tf.train.AdagradOptimizer(hyperparams['lr'])

	def send_weights(self, sid): 
		nodes = {}
		with tf.Session() as session: 
			for paramNode in graphRep.params:
				nodes[param] = session.run(graphRep.params[paramNode])
		self.socket.
		# package and send weights to a worker 

	def send_batch(self, sid, batch): 
		# package and send batch

	def train(self):
		# main training loop
		for epoch in xrange(self.hyperparams['epochs']): 
			while idx < len(data): 
				for worker in ready_connections:
					batch = data[idx: idx+self.hyperparams.batch_size]
					self.send_batch(sid, batch)
					if idx + batch_size < len(data):
						idx += self.hyperparams.batch_size
					else: 
						break
				if idx + batch_size < len(data): 
					batch = data[idx: idx+self.hyperparams.batch_size]
					self.model.train_batch
					idx += self.hyperparams.batch_size
					self.apply_grads()
				else:
					break

	def apply_grads(self):

	@self.socket.on('disconnect')
	def disconnect(self, sid, msg): 


	@self.socket.on('connect')	
	def connect(self, sid, msg):

	@self.socket.on('update')
	def receive_updates(self, sid, msg): 









