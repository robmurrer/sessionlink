const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3030 });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(data) { 
		wss.clients.forEach(function each(client) { 
			if (client !== ws && client.readyState === WebSocket.OPEN) client.send(data); 
		});
	});
});

console.log('Session Link started...');
