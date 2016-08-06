import tensorflow as tf
import socketio
import eventlet
import json
import threading

## GraphRep represents the API any model you feed Master must satisfy
class GraphRep: 

	def __init__(self, **hyperparams):
		return
		# implement any set up you need!, probably using hyper parameters dict as kwargs

	def preprocess(self, raw):
		# for if you want to preprocess any data before giving it to workers(i.e things like word vectors)
		return

	def construct_model(self):
		return
		# implement a model using tensorflow 

	def train_batch(self, batch):
		return
		# give back the loss operation for this model(for model warmup or parallel training)

	def apply_grads(self, grads):
		return	
		# apply gradients given back by the worker to the model(this is pretty easy in tensorflow!)

	@property
	def step_cache(self):
		return
		# send back step cache(dictionary of sqrt of sum of squared gradients) 
		# so that workers can properly use RMS prop

	@property
	def params(self):
		return
		# to get all trainable vars: [v for v in tf.trainable_variables()]
		# returns a dictionary mapping each variable's name to an array of weights


class Master:
	def __init__(self, socket_server, data=None, graphRep=None, epochs=1, hyperparams=1): 
		self.socket = socket_server
		self.data = data
		self.idx = 0
		self.model = graphRep	
		self.epochs = epochs
		self.bind_socket_cbs()
		self.hyperparams = hyperparams
		self.model.construct_model()
		self.update_counter = {}

	def preprocess(self, sid, msg): 
		batch = self.graphRep.preprocess(msg)
		batch = {
			'inputs': batch['inputs'],
			'labels': batch['labels']
		}
		self.send_batch(sid, batch, stop=True)

	def send_weights(self, sid): 
		model_data = {
			'id': sid,
			'data': self.graphRep.params,
			'step_cache': self.graphRep.step_cache
		}
		self.socket.emit('weights', data=model_data, room=sid)

	# assumes data is dictionary of numpy arrays
	def send_batch(self, sid, stop=False): 
		inputs = data['inputs'][idx:idx + self.hyperparams['batch_size']].tolist()
		labels = data['labels'][idx:idx + self.hyperparams['batch_size']].tolist()
		self.idx += self.hyperparams['batch_size']
		if self.idx + self.hyperparams['batch_size'] > self.data['train'].shape[0]:
			self.idx = 0
			self.epochs -= 1

		if self.epochs <= 0:
			print 'done'
			return

		batch = {
			'inputs': inputs,
			'labels': labels,
			'stop': stop
		}
		self.socket.emit('batch', data=batch, room=sid)

	def add_socket_callbacks(self):
		self.socket.on('connect', self.connect)
		self.socket.on('disconnect', self.disconnect)
		self.socket.on('raw', self.preprocess)
		self.socket.on('weights', self.receive_updates)

	# main training loop that you should use to warm up the model
	def background_train(self):
		for epoch in xrange(self.hyperparams['epochs']): 
			while idx < len(data): 
				if idx + batch_size < len(data): 
					inputs = data['inputs'][idx:idx + self.hyperparams['batch_size']]
					labels = data['labels'][idx:idx + self.hyperparams['batch_size']]
					batch = {
						'inputs': inputs,
						'labels': labels,
					}
					self.model.train_batch(batch)
					idx += self.hyperparams['batch_size']
					self.model.apply_grads()
				else:
					break

	def increment_counts(self):
		for sid in self.update_counter:
			self.update_counter[sid] += 1

	def disconnect(self, sid, msg):
		del self.update_counter[sid]

	def connect(self, sid, msg):
		self.update_counter[sid] = 0 
		self.send_weights(sid)
		if self.hyperparams['start_immediately']:
			self.send_batch(sid)

	def receive_updates(self, sid, msg):
		self.model.apply_grads(msg)
		self.increment_counts() 
		if self.update_counter[sid] >= self.hyperparams['update_count']:
			self.send_weights(sid)
		if msg.stop:
			self.send_batch(sid, msg.stop)








