import * as localForage from "localforage"
import sha256 from "crypto-js/sha256"
import Base64 from "crypto-js/enc-base64"
import uuid from "uuid"

import { PlayBlockState, PlayBlockType } from "./components/ISessionLink"
import { SocketCommand, SocketCommandType, SocketMessage } from "./components/SocketMessage"

export interface DeltaLink {
    block_id: string
    date: number
    block_old_md: any
    block_new_md: any
    json_delta: any
}

export interface Channel {
    in: {[key: string]: DeltaLink[]}
    out: {[key: string]: DeltaLink[]}
}

export class Commando {
    _block_id = ""
    _block_store: LocalForage | null = null
    _channel: Channel | null = null
    
    _ui_state?: any
    _selected_block_id = ""

    _root_block_callback: any
    _conn: WebSocket | null = null

    constructor(root_block_id: string) {
        this._block_id = root_block_id
        this._selected_block_id = root_block_id

        this._block_store = localForage.createInstance({name: root_block_id})
        this.ConnCreateWebSocket()
    }

    //get parent and add new block to it's id list
    //save both back to store
    async AddBlock(new_block: PlayBlockState, parent_block_id: string) {
       let mom = await this.Hydrate(parent_block_id)
       this._selected_block_id = new_block.id
       if (!mom.blocks) mom.blocks = []
       mom.blocks.push(new_block.id)
       let son = await this.Dehydrate(new_block);
       return await this.Dehydrate(mom)
    }

    //crypto means cryptography
    //returns a message digest of object json stringified
    //current impl uses sha256 (TODO AUDIT)
    Mark(b: any) {
       let sb_json = JSON.stringify(b)
       return Base64.stringify(sha256(sb_json))
    }


    //stomp or mutate block
    //compute message digest (md)
    //save to indexeddb
    //enque it to server
    async Dehydrate(b: PlayBlockState) {
       if (!this._block_store) return b

       let stomped = {...b}
       //reduce block to 500kb

       const md = this.Mark(stomped)
       await this._block_store.setItem(stomped.id, stomped) 

       //todo send to server
       this.Enqueue(md, stomped)

       return stomped 
    }

    Enqueue(md: string, stomped:PlayBlockState) {

    }

    async Hydrate(id: string) {
        const ghost: PlayBlockState = {
            id: id,
            title: "Untitled",
            value: "...",
            color: "lightskyblue",//get_random_color(),
            type: PlayBlockType.GHOST,
        }

       if (!this._block_store) {
           return ghost 
       }

       try {
           const b = await this._block_store.getItem(id) as PlayBlockState
           if (!b) return ghost
           return b
       }
       
       catch {
           //request from server...
           return ghost
       }
    }

    async TrySendServer(message: SocketMessage) {
        if (!this._conn || this._conn.readyState !== 1) {
            this.ConnCreateWebSocket()
            //todo add to queue
            return
        }

        //todo some throttling & error handling
        this._conn.send(JSON.stringify(message))
    }

    ConnCreateWebSocket()
    {
        const WS_URL = document.URL.replace('http://', 'ws://').replace('https://', 'wss://');
        this._conn = new WebSocket(WS_URL);

        this._conn.onopen = () => {
            console.log('+ WS Connection');

            const m: SocketMessage = {
                id: uuid(),
                command: SocketCommand.SUB,
                type: SocketCommandType.DOCUMENT,
                data: { 
                    id: this._block_id
                }
            }
            this.TrySendServer(m);
        };

        this._conn.onmessage = evt => {
            this.handleSocketMessage(evt);
        };

        this._conn.onclose = () => {
            console.log("- WS Disconnection");
            setTimeout(this.ConnCreateWebSocket.bind(this), 5000);
        };
    }

    handleSocketMessage(event: MessageEvent) {
        const message: SocketMessage = JSON.parse(event.data);
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

    SocketProcessSubscribe(message: SocketMessage) {
        this._root_block_callback(message);
    }

    SocketProcessDocument(message: SocketMessage) {
        this._root_block_callback(message);

    }

    SocketProcessSocial(message: SocketMessage) {
        this._root_block_callback(message);

    }
}