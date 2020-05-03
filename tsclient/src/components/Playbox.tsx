/*  Playbox React Component
    Copyright 2019 Rob Murrer - All Rights Reserved
    No Warranty - Not Fit for Public Consumption

    Pass in Root Block and Watch it Go.
*/
import * as React from "react"
import * as ContentEditable from "react-contenteditable"
import uuid from "uuid"
import * as localForage from "localforage"

import { FileDrop, } from "./FileDrop"
import { Block, BlockProps } from "./Block"
import { Cursor } from "./Cursor"

import { SocketMessage_LEGACY, SocketCommand, SocketCommandType } from "./SocketMessage"

let QRCode = require("qrcode.react")

export interface PlayboxProps {
    block: BlockProps,
};

enum PlayboxStates {
    HYDRATING, //serialize from local copy... kids these days
    DISCONNECTED_SERVER,
    CONNECTED_SERVER,
    SYNCING_SERVER,
    ERROR,
}

interface Point {
    x: number,
    y: number
}

export interface PlayboxState {
    state: PlayboxStates,
    root_block: BlockProps,
    store: LocalForage,
    blocks: {[key: string]: BlockProps},
    offline: boolean,
    next_x?: number,
    next_y?: number,
    cursor_x?: number,
    cursor_y?: number,
    selected_block?: string,

    user_id: string,
    user_color: string,

    conn?: WebSocket,
    msg_queue?: SocketMessage_LEGACY[],
    cursors?: {[key: string]: BlockProps},
};

export enum Command {
    Create,
    Update,
    Network,
    Delete,
    Archive,
}

const PUSH_X = 300;
const OFFSET_XY = 30;
function GetDefaultState(props: PlayboxProps) {
    let state: PlayboxState = { 
        state: PlayboxStates.HYDRATING,
        root_block: props.block,
        blocks: {},
        store: localForage.createInstance({name: props.block.id}),
        //next_x: OFFSET_XY, 
        //next_y: OFFSET_XY,
        offline: true,
        user_id: uuid(),
        user_color: get_random_color(),

    };

    state.root_block.title = state.root_block.title || "";

    return state;
}

// tasty copy pasta stack overflow
export function get_random_color() {
	function c() {
		var hex = Math.floor(Math.random() * 256).toString(16);
		return ("0" + String(hex)).substr(-2); // pad with zero
	}
	return "#" + c() + c() + c();
}

export class Playbox extends React.Component<PlayboxProps, PlayboxState> {
    BlackboardRef = React.createRef<HTMLDivElement>();
    RootBlockTitle = React.createRef<HTMLElement>();
    SelectedBlock = React.createRef<HTMLElement>(); 

    constructor(props: PlayboxProps) {
        super(props);
        this.state = GetDefaultState(this.props);
    }

    DehydrateBlock(block: BlockProps) {
        let new_block = block;
        delete new_block.commando; //cannot clone with function props
        this.state.store.setItem(block.id, block);
    }

    async HydrateBlock(id: string) {
        let result: {[key:string]: BlockProps} = {};
        let blockchain: BlockProps = {id: id, blocks: []}; 

        try {
            blockchain = await this.state.store.getItem(id) as BlockProps;
        }
        catch {
            console.log("! block not in store")
        }

        if (!blockchain) {
            blockchain = {
                id: id,
                title: "Untitled",
                blocks: [],
            }
        }

        result[id] = blockchain;

        if (blockchain.blocks) {
            for (let i=0; i<blockchain.blocks.length; i++) {
                let children = await this.HydrateBlock(blockchain.blocks[i]);
                result = Object.assign({}, result, children);
            }
        }
        return result;
    }

    async TrySendServer(message: SocketMessage_LEGACY) {
        if (!this.state.conn || this.state.conn.readyState !== 1) {
            //todo: enqueue offline mode...
            return;
        }

        //do some throttling
        //need a big old try catch?
        this.state.conn.send(JSON.stringify(message));
    }

    // converts to global point space
	GetGlobalPoint(client_x: number, client_y: number)
	{
        if (!this.BlackboardRef.current) return {x: NaN, y:NaN};

		const rel_pos = this.BlackboardRef.current.getBoundingClientRect();
		const _x = client_x;
		const _y = client_y; 
		const x = _x - rel_pos.left;
		const y = _y - rel_pos.top;

		return {x: x, y: y};
    }

    ConnCreateWebSocket()
    {
        const WS_URL = document.URL.replace('http://', 'ws://').replace('https://', 'wss://');
        let conn = new WebSocket(WS_URL);

        conn.onopen = () => {
            console.log('+ WS Connection');
            let new_state = {...this.state};
            new_state.state = PlayboxStates.CONNECTED_SERVER;
            new_state.offline = false; //duplicated?
            this.setState(new_state);

            const m: SocketMessage_LEGACY = {
                id: uuid(),
                command: SocketCommand.SUB,
                type: SocketCommandType.DOCUMENT,
                data: { 
                    id: this.state.root_block.id, 
                    title: this.state.user_id,
                    color: this.state.user_color,
                }
            }
            this.TrySendServer(m);
        };

        conn.onmessage = evt => {
            this.handleSocketMessage(evt);
        };

        conn.onclose = () => {
            console.log("- WS Disconnection");
            let new_state = {...this.state};
            new_state.state = PlayboxStates.DISCONNECTED_SERVER;
            new_state.conn = undefined;
            this.setState(new_state);
            setTimeout(this.ConnCreateWebSocket.bind(this), 5000);
        };

        return conn;
    }


    // oldschool react shit
    async componentDidMount() {
        let new_state = {...this.state};

        new_state.blocks = await this.HydrateBlock(new_state.root_block.id);
        new_state.root_block = new_state.blocks[new_state.root_block.id];

        new_state.conn = this.ConnCreateWebSocket();

        this.setState(new_state);

        //select root block's title
        if (this.RootBlockTitle.current === null) return
        this.RootBlockTitle.current.focus();
    }

    handleTitleEditEnter(event: React.KeyboardEvent) {
        if (event.keyCode === 13) {
            event.preventDefault();
            if (this.state.root_block.blocks && this.state.root_block.blocks.length === 0) {
                this.handleAddBlockLink_();
                return;
            }
            let state = {...this.state};
            if (!state.root_block.blocks || state.root_block.blocks.length === 0) return;
            state.selected_block = state.root_block.blocks[0];
            this.setState(state);
        }
    } 

    handleAddBlockLink_() {
        let state = {...this.state};

        let new_block: BlockProps = {
            id: uuid(),
            title: "Untitled",
            value: "Write something good...", 
            //x: state.next_x,
            //y: state.next_y,
        }

        state.selected_block = new_block.id;

        if (!state.root_block.blocks) state.root_block.blocks = [];
        state.root_block.blocks.push(new_block.id);

        if (!state.blocks) state.blocks = {};
        state.blocks[new_block.id] = new_block;

        //state.next_x = state.next_x + PUSH_X;

        this.setState(state);
        this.DehydrateBlock(new_block);
        this.DehydrateBlock(state.root_block)

        const m2: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: state.root_block, 
        }

        this.TrySendServer(m2);

        const m: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: new_block, 
        }

        this.TrySendServer(m);
    }

    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let new_title = event.target.value;
        let state = {...this.state};
        state.root_block.title = new_title;
        this.setState(state);
        this.DehydrateBlock(state.root_block);

        const m: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: state.root_block 
        }

        this.TrySendServer(m);
    }

    highlightTitle() {
        setTimeout(() => { document.execCommand('selectAll', false)}, 0);
    }

    handleAddBlockLink(event: React.MouseEvent) {
        event.preventDefault();
        this.handleAddBlockLink_()
    }

    handleSocketMessage(event: MessageEvent) {
        const message: SocketMessage_LEGACY = JSON.parse(event.data);
        //console.log(message);
        switch(message.command){
            case SocketCommand.PUB:
                switch(message.type) {
                    case SocketCommandType.SOCIAL:
                        this.SocketProcessSocial(message);
                        break;
                    case SocketCommandType.DOCUMENT:
                        this.SocketProcessDocument(message);
                        break;
                    default:
                        break;
                }
                break;

            case SocketCommand.SUB:
                this.SocketProcessSubscribe(message);
                break;

            default:
                break;
        } 
    }


    SocketProcessSubscribe(message: SocketMessage_LEGACY) {
        const m: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: this.state.root_block, 
        }
        this.TrySendServer(m);

        if (!this.state.root_block.blocks) return;
        this.state.root_block.blocks.map( id => {
            const m: SocketMessage_LEGACY = {
                id: uuid(),
                command: SocketCommand.PUB,
                type: SocketCommandType.DOCUMENT,
                data: this.state.blocks[id]
            }
            this.TrySendServer(m);
        });
    }

    SocketProcessDocument(message: SocketMessage_LEGACY) {
        this.handleCommando(message.data, Command.Network);
    }
    

    SocketProcessSocial(m: SocketMessage_LEGACY) {
        if (!m.data.title || !m.data.id) return;
        let state = {...this.state};
        if (!state.cursors) state.cursors = {};

        state.cursors[m.data.id] = m.data;

        const e = m.data.title.toLowerCase();
        switch (e)
        {
            case "move":
                break;

            case "click":
                break;

            default:
                break;
        }

        this.setState(state);
    }

    handleClick(event: React.MouseEvent) {
        const cursor_pos: Point = this.GetGlobalPoint(event.clientX, event.clientY);
        const m: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.SOCIAL, 
            data: { 
                id: this.state.user_id, 
                title: "click", 
                x: cursor_pos.x, 
                y: cursor_pos.y,
                color: this.state.user_color,
            } 
        }

        this.TrySendServer(m);
    }

    handleMouseMove(event: React.MouseEvent) {
        const cursor_pos = this.GetGlobalPoint(event.clientX, event.clientY)
        const m: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.SOCIAL,
            data: { 
                id: this.state.user_id, 
                title: "move", 
                x: cursor_pos.x, 
                y: cursor_pos.y,
                color: this.state.user_color,
            } 
        }

        this.TrySendServer(m);
    }

    handleCommando(block: BlockProps, command: Command = Command.Update) {
        let state = {...this.state};

        if (state.root_block.id === block.id) {
            state.root_block = block;
        }
        else {
            state.blocks[block.id] = block;
        }

        const block_message: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: block
        }

        const root_block_message: SocketMessage_LEGACY = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.DOCUMENT,
            data: state.root_block
        }

        switch (command) {
            case Command.Create:
                if (!state.root_block.blocks) state.root_block.blocks = [];
                state.root_block.blocks.push(block.id);
                this.DehydrateBlock(state.root_block);
                this.DehydrateBlock(block);
                this.TrySendServer(root_block_message);
                this.TrySendServer(block_message);
                break;

            case Command.Update:
                this.TrySendServer(block_message);
                this.DehydrateBlock(block);

            case Command.Network: //todo verify sender?
                //check contents of block compared to what we have in store
                //switch on this
                this.DehydrateBlock(block);
            break;

            default:
                break;
        }

        this.setState(state);
    }

    

    render() {
        document.title = this.state.root_block.title + " - Session Link";

        let no_root_block = {...this.state.blocks};
        delete no_root_block[this.state.root_block.id];

        return (
            <FileDrop commando={this.handleCommando.bind(this)}>
                <div className="Playbox">
                    <h1>
                        <ContentEditable.default 
                            innerRef={this.RootBlockTitle}
                            html={this.state.root_block.title || ""}
                            onChange={this.handleTitleEdit.bind(this)} 
                            onFocus={this.highlightTitle.bind(this)}
                            onKeyDown={this.handleTitleEditEnter.bind(this)}
                        />
                    </h1>
                    <div className="Plusbar">
                        <a onClick={this.handleAddBlockLink.bind(this)} href="">+</a>
                    </div>
                    <hr/>
                    <div 
                        ref={this.BlackboardRef} 
                        className="Blackboard" 
                        onClick={this.handleClick.bind(this)}
                        onMouseMove={this.handleMouseMove.bind(this)}>

                            {Object.entries(no_root_block|| {}).reverse().map(([key, b]) => {
                                let ref = null;
                                let selected = false;
                                if (this.state.selected_block !== null) {
                                   if (b.id === this.state.selected_block) {
                                        ref = this.SelectedBlock;
                                        selected = true;
                                   } 
                                }
                                return <Block innerRef={ref} selected={selected} key={b.id} {...b} commando={this.handleCommando.bind(this)}/>;
                            })}

                            {Object.entries(this.state.cursors || {}).map(([key, b]) => {
                                return  <Cursor data={b}></Cursor>
                            })}


                    </div>
                    {this.props.children}
                    

                    <h3>Scan QRCode</h3>
                    <div className="QRCode"><QRCode value={document.URL}></QRCode></div>
                </div>
            </FileDrop>
        );
    }
}