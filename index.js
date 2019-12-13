// Session Link Funhouse Server
// (c) 2019 Rob Murrer
// All Rights Reserved.
// Not Fit For Public Consumption.

const DEBUG = true; //todo: toogle on ship one point oh

const express = require('express');
const session = require('express-session');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const uuid = require('uuid');
const app = express();

const SessionParser = session({
	secret: (DEBUG ? 'hi mom and dad!' : process.env.SERVER_KEY)
});

//app.use(SessionParser);
app.use(express.static(path.join(__dirname, 'tsclient/build')));

app.post('/login', function(req, res) {
	const id = uuid.v4();
	//console.log(req.body); todo: need body parser middleware
	req.session.userId = id;
	res.send({ result: 'OK', message: 'Session updated' });
});

app.get('/', (req, res) => {
	//if (DEBUG) console.log(req);
	res.sendFile(path.join(__dirname+'/tsclient/build/index.html'));
});

// Wishlist server states/commands
//client request_sync
//client sync_complete
//client change_key
//client zero_users (the sadest state of them all)
//client change_key //burns it all down

const HttpServer = http.createServer(app);
const WebSocketServer = new WebSocket.Server({ noServer: true}); 

const UsersDictionary = {};

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
		const message_json = JSON.parse(message);
		if (DEBUG) console.log(message_json);

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

console.log('Funhouse Server Started');
console.log('Listening on port: ' + port);
if (DEBUG) console.log('! In DEBUG mode, not fit for User Consumption');
