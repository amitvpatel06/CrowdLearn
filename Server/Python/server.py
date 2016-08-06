
# needed to wrap the socket and listen on a certain port
# can regulate how workers communicate by choosing the async operation mode of the socket server here

from flask import Flask, render_template
import eventlet
import socketio

from master import Master
sio = socketio.Server()
app = Flask(__name__)

test = Master(sio)

@app.route('/')
def index():
    """Serve the client-side application."""
    return render_template('index.html')



if __name__ == '__main__':
    app = socketio.Middleware(sio, app)
    eventlet.wsgi.server(eventlet.listen(('', 80)), app)