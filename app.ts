// Session Link Funhouse Server
// The Typescript Port
// (c) 2019 Rob Murrer
// All Rights Reserved.
// Not Fit For Public Consumption.

const DEBUG = true; //todo: toogle on ship one point oh

import express = require('express')
import bodyParser = require('body-parser');
import session = require('express-session')
import http = require('http')
import path = require('path')
import WebSocket = require('ws')
import uuid = require('uuid')

import {BlockProps} from "./tsclient/src/components/Block"
import {SocketMessage, SocketCommandType, SocketCommand} from "./tsclient/src/components/SocketMessage"

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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

interface Channels {
    users: {[key: string]: WebSocket[]},
}

const ServerState: Channels = {users:{}};

WebSocketServer.on('connection', function connection(ws, req) {
	if (DEBUG) console.log('+ Someone connected');
    //if (DEBUG) console.log(request);

	ws.on('message', function incoming(m) {
		if (!req.url) return;

        const url = new URL("http://www.fake.com" + req.url);
		const id = url.searchParams.get('id');

        if (!id) return;
		if (!ServerState.users) return;

		const message: SocketMessage = JSON.parse(m.toString());
		switch (message.type) {
			case SocketCommandType.DOCUMENT:
				if (message.command === SocketCommand.SUB) {
					if (ServerState.users[id] === undefined) {
						ServerState.users[id] = [];
					}
					ServerState.users[id].push(ws)
				}
				break;
			case SocketCommandType.SOCIAL:
				break;
			default:
				break;
		}

		ServerState.users[id].map(s => {
			if (s === ws) return;
			if (s.readyState === WebSocket.OPEN) {
				s.send(JSON.stringify(message))
			}
		});

		/* full rebound method:
		WebSocketServer.clients.forEach(function each(client_) {
			if (client_ !== ws && client_.readyState === WebSocket.OPEN) {
                client_.send(JSON.stringify(m));
            }
		});
		*/
	});

});


HttpServer.on('upgrade', function(req, socket, head) {
	if (DEBUG) console.log("^ Upgraded Websocket Connection")

	/*
	SessionParser(request, {}, () => {
		if (!request.session || !request.session.userId) {
			socket.destroy();
			return;
		}
	});
	*/

	WebSocketServer.handleUpgrade(req, socket, head, function(ws) {
		if (DEBUG) console.log('x Upgrading...');
		WebSocketServer.emit('connection', ws, req);
	});
});


const port = process.env.PORT || 5000;
HttpServer.listen(port);

console.log('Funhouse TS (v2) Server Started');
console.log('Listening on port: ' + port);
if (DEBUG) console.log('! In DEBUG mode, not fit for User Consumption');
