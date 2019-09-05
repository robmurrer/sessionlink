const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
const httpServer = http.createServer(app);
//app.listen(port);

const wss = new WebSocket.Server({ 'server': httpServer });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(data) { 
		wss.clients.forEach(function each(client) { 
			if (client !== ws && client.readyState === WebSocket.OPEN) client.send(data); 
		});
	});
});

httpServer.listen(port);
console.log('Session Link started...');
