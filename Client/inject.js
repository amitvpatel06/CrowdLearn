var worker = document.createElement('script');
worker.src = chrome.extension.getURL('worker.js');
var convnet = document.createElement('script');
convnet.src = chrome.extension.getURL('convnet.js');
var rnet = document.createElement('script');
rnet.src = chrome.extension.getURL('rl.js');

var socket = document.createElement('script');
socket.src = 'https://cdn.socket.io/socket.io-1.4.5.js';

(document.head||document.documentElement).appendChild(convnet);
(document.head||document.documentElement).appendChild(rnet);
(document.head||document.documentElement).appendChild(socket);

worker.onload = function() {
    worker.parentNode.removeChild(worker);
};
convnet.onload = function() {
    convnet.parentNode.removeChild(convnet);
};
rnet.onload = function() {
    rnet.parentNode.removeChild(rnet);
};
socket.onload = function() {
	(document.head||document.documentElement).appendChild(worker);
    socket.parentNode.removeChild(socket);
};


