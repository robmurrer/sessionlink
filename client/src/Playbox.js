import React, { Component } from 'react'
import Block from './Block'
const uuid_rand = require('uuid/v4'); //should i import here?

const production = 'wss://sessionlink.herokuapp.com';
const development = 'ws://localhost:5000';
const URL = (process.env.NODE_ENV ? production : development);

function get_random_color() {
	function c() {
		var hex = Math.floor(Math.random() * 256).toString(16);
		return ("0" + String(hex)).substr(-2); // pad with zero
	}
	return "#" + c() + c() + c();
}

class Playbox extends Component {
	state = {
		user_id: uuid_rand(), 
		user_color: get_random_color(), 
		blocks: [],
		cursors: {},
		clicked: false,
	};

    ws = null; 
    cur_x = 0;
    cur_y = 0;

	createWebSocket() {
		this.ws = new WebSocket(URL);
		this.ws.onopen = () => {
			console.log('connected');
		};

		this.ws.onmessage = evt => {
			const message = JSON.parse(evt.data);
			this.setCursorState(message);
			//console.log(message);
		}

		this.ws.onclose = () => {
			console.log('disconnected');
			this.ws = null;
			this.createWebSocket();
		};

	}

	componentDidMount() {
		this.createWebSocket();
	}

	setCursorState(message) {
		const cursors = Object.assign({}, this.state.cursors, {});
		cursors[message.id] = {id: message.id, x: message.x, y: message.y, color: message.color};
		this.setState(state => ({ cursors })); //so this just grabs local copy and merges to global state?
		//this.setState(state => ({ cursors: cursors })); //no need to repeat yourself
	}

	updateCursor(cursor_pos) {
		const message = { id: this.state.user_id, x: cursor_pos.x, y: cursor_pos.y, color: this.state.user_color };
		this.setCursorState(message);	

		if (this.ws.readyState !== 1) return; //should we try to reconnect?
		this.ws.send(JSON.stringify(message));
	}
	
	updateBlock(block) {
		this.setCursorState(block);
		if (this.ws.readyState !== 1) return; //should we try to reconnect?
		this.ws.send(JSON.stringify(block));
	}


	move(evt) {
		if(this.state.clicked) return;

		const rel_pos = this.refs.blackboard.getBoundingClientRect();
		const _x = evt.clientX;
		const _y = evt.clientY;
		const x = this.cur_x = _x - rel_pos.left;
		const y = this.cur_y = _y - rel_pos.top;

		this.updateCursor({x: x, y: y});
		//console.log(x,y);
	}

	clickToggle(evt) {
		this.setState(state => ({clicked: !state.clicked}));
		console.log('clickToggle: ' + this.state.clicked);
    }
    
    addBlock() {
        const blocks = this.state.blocks;
        const b = {
            id: uuid_rand(),
            author: this.state.user_id,
            color: this.state.user_color,
            x: this.cur_x,
            y: this.cur_y,
        }
        //this.setState(state => ({ blocks: blocks.concat([b])}));
		this.updateBlock(b);
    }

	render() {
		return (
			<div id='playbox'>
				<div ref='blackboard' id='blackboard' onClick={this.addBlock.bind(this)} onMouseMove={this.move.bind(this)}>
                <h1>Session Link</h1>
				{
                 Object.entries(this.state.cursors).map(([key, value]) =>
                         <Block key={value.id} color={value.color} x={value.x} y={value.y} />
				 )
				}
				{
                 this.state.blocks.map(value => 
                         <Block key={value.id} color={value.color} x={value.x} y={value.y} />
				 )
				}
				</div>
			</div>
		)
	}

}

export default Playbox;