
// still need to get server set up


var Worker = {
	socket: null,
	Graph: R.Graph(),
	setUp: function(url) {
		this.socket = io.connect(url);
		this.socket.on('news', function (data) {
		    console.log(data);
  		});

	},

	mainLoop: function() {

	},

	createModel: function(initial_message) {

	},


	updateModel: function(update_message) {

	}
}

Worker.setUp('http://localhost');