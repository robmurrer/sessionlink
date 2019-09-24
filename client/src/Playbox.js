// Playbox - The Funhouse Run
// (c) 2019 Rob Murrer
// All Rights Reserved
// Not Suitable for Public Consumption

import React, { Component } from 'react';
import Block from './Block';
import { get_random_color } from './Color.js';

const uuid_rand = require('uuid/v4');  //why not import here?

const DEBUG = true; //todo toogle on deploy
// TODO: Need to force https!!!

// sessionlink.herokuapp.com/b0/Title/id
const WS_URL = document.URL.replace('http://', 'ws://').replace('https://', 'wss://');


console.log('Playbox - The Funhouse Run');
if (DEBUG) console.log('! Not fit for user consumption !');
console.log("Funhouse Server URL: ")
console.log(WS_URL);

//constants that need to be shared with client/server?
const BLOCK_ADD_UPDATE = 'BLOCK_ADD_UPDATE';

// the big state machine
class Playbox extends Component {
	state = {
		root_block_id: uuid_rand(), //can derive from URL?
		root_block_title: 'Session Link',
		block_size: '30px',
		blocks: {}, //the real block chain

		user_id: uuid_rand(), 
		user_color: get_random_color(), 
		cursor_color: get_random_color(),
		
		cursor_x: 0,
		cursor_y: 0,
		cursor_clicked: false, //user cursor state
	};

	conn = null; //should this be state?

	// Entry Point... Everything is Ready
	componentDidMount() {
		if (Object.keys(this.state.blocks).length === 0)
		{
			const master_block = {
				id: this.state.root_block_id,
				author: this.state.user_id,
				color: this.state.user_color,
				x: 0, 
				y: 0, 
			}


			//this.blockSyncDisplayServer(master_block);
			this.blockSetState(master_block)
		}

		if (this.state.server_off === true) return;
		this.connCreateWebSocket();
	}

	connCreateWebSocket() {
		this.conn = new WebSocket(WS_URL);
		this.conn.onopen = () => {
			//this.conn.send(JSON.stringify({ hi: 'mom'}));
			console.log('Funhouse Server: Connected');
		};

		//!  server message!
		this.conn.onmessage = evt => {
			const message = JSON.parse(evt.data);
			if (DEBUG) console.log("+ Message from server: ");
			if (DEBUG) console.log(message);

			// Commands
			if (message.command === BLOCK_ADD_UPDATE)
			{
				//if (DEBUG) console.log("Adding/Updating Block From Server");
				this.blockSetState(message.block);
			}

			// another client requests sync
			//...
		}

		//try to restart... todo: add backoff period/throttling
		this.conn.onclose = () => {
			console.log('Funhouse Server: Disconnected');
			this.conn = null;
			setTimeout(this.connCreateWebSocket.bind(this), 5000);
		};
	}

	// Merges state without round trip to server
	//
	blockSetState(block) {
		//if (DEBUG) console.log('Adding Block:');
		//if (DEBUG) console.log(block);
		const blocks = Object.assign({}, this.state.blocks, {});
		blocks[block.id] = block; 
		this.setState(state => ({ blocks })); //so this just grabs local copy and merges to global state
	}
	
	blockSyncDisplayServer(block) {
		this.blockSetState(block);

		// should we try to reconnect?
		// data loss perhaps unless server calls resync
		// add to queue to send?

		if (!this.conn || this.conn.readyState !== 1) return; 

		//build message for server
		const message = {
			command: BLOCK_ADD_UPDATE,
			block: block,
		}

		this.conn.send(JSON.stringify(message));
	}

	cursorMoveEvent(evt) {
		const cursor_pos = this.cursorGetCurrentPosition(evt.clientX, evt.clientY);
		this.setState(state => ({
			cursor_x: cursor_pos.x,
			cursor_y: cursor_pos.y,
		}));

		if (this.state.cursor_clicked) return;
		if (this.state.cursor_off) return;
		this.blockAddOrUpdate(true);
	}


	cursorSetClickStateToggle(evt) {
		this.setState(state => ({cursor_clicked: !state.cursor_clicked}));
		if (!this.state.cursor_clicked)
		{
			this.blockAddOrUpdate();
		}
    }
	

    blockAddOrUpdate(cursor_mode) {
		let block_to_add = {
            id: uuid_rand(),
            author: this.state.user_id,
            color: this.state.user_color,
            x: this.state.cursor_x,
			y: this.state.cursor_y,
		}

		if (cursor_mode) {
			block_to_add.id = this.state.user_id;
		}

		this.blockSyncDisplayServer(block_to_add);
    }


	blockUpdateText(block_id, block_text)
	{
		console.log('todo');
		console.log(block_id);
		console.log(block_text);
	};


	cursorGetCurrentPosition(client_x, client_y)
	{
		const rel_pos = this.refs.blackboard.getBoundingClientRect();
		const _x = client_x;
		const _y = client_y; 
		const x = _x - rel_pos.left;
		const y = _y - rel_pos.top;

		return {x: x, y: y};
	}


	reloadStateFromDisk()
	{
		//user stuff
		//blocks empty?
	}
	//todo: persist state to indexedDB
	flushBlocksToDisk()
	{
	}

	loginEvent(evt)
	{
		fetch('/login', {
			method: 'POST', 
			credentials: 'same-origin', 
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({password: this.refs.login_pw.value}) 
			});
	}

	render() {
		//if (DEBUG) console.log("Playbox Render");
		const id = this.state.root_block_id;
		const title = this.state.root_block_title;
		const blocks = this.state.blocks;
		const grid_size = this.state.block_size;

		return (
			<div id='playbox'>
				<div ref='blackboard' id='blackboard' onClick={this.cursorSetClickStateToggle.bind(this)} onMouseMove={this.cursorMoveEvent.bind(this)}>
					<h1 style={{marginLeft: grid_size}}>{title}</h1>
					{
                 	Object.entries(blocks).map(([key, block]) =>
                        <Block key={block.id} grid_size={grid_size} block_update_text={this.blockUpdateText.bind(this)} block_object={block} /> 
					)} 
				</div>
				<input type="password" ref="login_pw"></input><button id="login_button" onClick={this.loginEvent.bind(this)} type="button">login</button>
			</div>
	)}
}

export default Playbox;