var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//var master = require('./master.js');



server.listen(80);

app.get('/', function (req, res) {
  res.send("hello");
});

io.on('connection', function (socket) {
  console.log(socket.conn.id);
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});