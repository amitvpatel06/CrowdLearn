# import tensorflow as tf
import socketio
import eventlet






class Master:

	def __init__(self, socket_server, data, graphRep, epochs, is_update): 
		self.socket = socket_server
		self.data = data
		self.model = graphRep	
		self.construct_graph()
		self.epochs = epochs
		self.ready_connections = {}
		self.working_connections = {}
		self.current_state
		self.bind_socket_cbs()


	def construct_graph(self): 
		# parse and then create tensor flow graph

	def send_weights(self, sid): 
		# package and send weights to a worker 

	def train(self):
		# main training loop

	def disconnect(self, sid, msg): 
		
	def connect(self, sid, msg):

	def receiveUpdates(self, sid, msg): 

	def receiveLabels(self, sid, msg):

	def bind_socket_cbs(self): 







