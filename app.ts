// Session Link Funhouse Server
// The Typescript Port
// (c) 2019 Rob Murrer
// All Rights Reserved.
// Not Fit For Public Consumption.

const DEBUG = true; //todo: toogle on ship one point oh

import express = require('express')
import session = require('express-session')
import http = require('http')
import path = require('path')
import WebSocket = require('ws')
import uuid = require('uuid')

const app = express();
const CLIENT = '../tsclient/build';
app.use(express.static(path.join(__dirname, CLIENT)));
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname+CLIENT+'/index.html'));
});

// Wishlist server states/commands
//client request_sync
//client sync_complete
//client change_key
//client zero_users (the sadest state of them all)
//client change_key //burns it all down

const HttpServer = http.createServer(app);
const WebSocketServer = new WebSocket.Server({ noServer: true}); 

if (DEBUG) setInterval(
	function heartbeat() {
		let client_count = 0;
		WebSocketServer.clients.forEach(function each(client_) {
			if (client_.readyState === WebSocket.OPEN) {
				client_.send(JSON.stringify({heartbeat: Date.now()}));
				//if (DEBUG) console.log(`> Heartbeat... ${++client_count}`);
			}
		})
	} , 30000);

WebSocketServer.on('connection', function connection(ws, request) {
	if (DEBUG) console.log('+ Someone connected');
	//if (DEBUG) console.log(request);

	ws.on('message', function incoming(message) {
		//if (DEBUG) console.log('+ Got Message');
		// ! must parse it... can we fail and be insecure with overrun!?
		const message_json = JSON.parse(message.toString());
		//if (DEBUG) console.log(message_json);

		let rebound = message_json;

		WebSocketServer.clients.forEach(function each(client_) {
			if (client_ !== ws && client_.readyState === WebSocket.OPEN) client_.send(JSON.stringify(rebound));
		});
	});

});


HttpServer.on('upgrade', function(request, socket, head) {
	if (DEBUG) console.log("^ Upgraded Websocket Connection")

	/*
	SessionParser(request, {}, () => {
		if (!request.session || !request.session.userId) {
			socket.destroy();
			return;
		}
	});
	*/

	WebSocketServer.handleUpgrade(request, socket, head, function(ws) {
		if (DEBUG) console.log('x Upgrading...');
		WebSocketServer.emit('connection', ws, request);
	});
});


const port = process.env.PORT || 5000;
HttpServer.listen(port);

console.log('Funhouse TS (v2) Server Started');
console.log('Listening on port: ' + port);
if (DEBUG) console.log('! In DEBUG mode, not fit for User Consumption');
