import React, { Component } from 'react'

//const URL = 'ws://localhost:5000';
const URL = 'wss://localhost';

function get_random_color() {
	  function c() {
		      var hex = Math.floor(Math.random()*256).toString(16);
		      return ("0"+String(hex)).substr(-2); // pad with zero
		    }
	  return "#"+c()+c()+c();
}

class Playbox extends Component {
	state = {
		name: Math.floor(Math.random()* 1e6),  
		color: get_random_color(), 
		messages: [],
		cursors: {},
		clicked: false,
	};

	ws = new WebSocket(URL); //is this state?

	componentDidMount() {
		this.ws.onopen = () => {
			console.log('connected');
		};

		this.ws.onmessage = evt => {
			const message = JSON.parse(evt.data);
			this.updateCursors(message);
		}

		this.ws.onclose = () => {
			console.log('disconnected');
			this.setState({
				ws: new WebSocket(URL), //why do we have to set state here and not before?
			});
		};
	}

	updateCursors(message) {
		const cursors = Object.assign({}, this.state.cursors, {});
		cursors[message.name] = {x: message.x, y: message.y, color: message.color};
		this.setState(state => ({ cursors })); //so this just grabs local copy and merges to global state?
		//this.setState(state => ({ cursors: cursors })); //no need to repeat yourself
	}

	sendCursorToServer(cursor_pos) {
		const message = { name: this.state.name, x: cursor_pos.x, y: cursor_pos.y, color: this.state.color };
		this.ws.send(JSON.stringify(message));
		this.updateCursors(message);	
	}
	
	move(evt) {
		if(this.state.clicked) return;

		const rel_pos = this.refs.blackboard.getBoundingClientRect();
		const _x = evt.clientX;
		const _y = evt.clientY;
		const x = _x - rel_pos.left;
		const y = _y - rel_pos.top;

		this.sendCursorToServer({x: x, y: y});
		//console.log(x,y);
	}

	clickToggle(evt) {
		this.setState(state => ({clicked: !state.clicked}));
		console.log('clickToggle: ' + this.state.clicked);
	}

	render() {
		return (
			<div id='playbox'>
				<div ref='blackboard' id='blackboard' onClick={this.clickToggle.bind(this)} onMouseMove={this.move.bind(this)}>
				{
				 Object.entries(this.state.cursors).map(([key, value]) =>
						<div 
							className='player' 
							style={{backgroundColor: value.color, left: value.x, top: value.y}}>
						</div>
				 )
				}
				</div>
			</div>
		);
	}

}

export default Playbox



		
	
