import * as localForage from "localforage"
import sha256 from "crypto-js/sha256"
import Base64 from "crypto-js/enc-base64"

import { PlayBlockState, PlayBlockType } from "./components/PlayBlock"
import { User } from "./User"
import { get_random_color } from "./components/Playbox"
import { SocketMessage, SocketCommand, SocketCommandType } from "./components/SocketMessage"
import uuid from "uuid"


export class Commando {
    block_id = ""
    block_store: LocalForage | null = null

    pending_updates: {[key: string]: PlayBlockState} = {}
    
    selected_block_id = ""
    user: User | null = null 
    root_block_callback: any
    conn: WebSocket | null = null

    constructor(root_block_id: string) {
        this.block_id = root_block_id
        this.selected_block_id = root_block_id
        this.block_store = localForage.createInstance({name: root_block_id})
        this.ConnCreateWebSocket()
    }

    async AddBlock(new_block: PlayBlockState, parent_block_id: string) {
       let mom = await this.Hydrate(parent_block_id)
       this.selected_block_id = new_block.id
       if (!mom.blocks) mom.blocks = []
       mom.blocks.push(new_block.id)
       let son = await this.Dehydrate(new_block);
       return await this.Dehydrate(mom)
    }

    Mark(b: PlayBlockState) {
       let sb = {...b}

       sb.md_shallow = undefined

       let sb_json = JSON.stringify(sb)
       sb.md_shallow = Base64.stringify(sha256(sb_json))

       return sb
    }


    //computer message digest
    //save to indexeddb
    //send it to server
    async Dehydrate(b: PlayBlockState) {
       if (!this.block_store) return b

       const marked_block = this.Mark(b)
       await this.block_store.setItem(b.id, marked_block) 

       //todo send to server

       return marked_block 
    }

    async Hydrate(id: string) {
        const ghost: PlayBlockState = {
            id: id,
            title: "Untitled",
            value: "...",
            color: "lightskyblue",//get_random_color(),
            type: PlayBlockType.GHOST,
        }

       if (!this.block_store) {
           return ghost 
       }

       try {
           const b = await this.block_store.getItem(id) as PlayBlockState
           if (!b) return ghost
           return b
       }
       
       catch {
           //request from server...
           return ghost
       }
    }

    async TrySendServer(message: SocketMessage) {
        if (!this.conn || this.conn.readyState !== 1) {
            this.ConnCreateWebSocket()
            //todo add to queue
            return
        }

        //todo some throttling & error handling
        this.conn.send(JSON.stringify(message))
    }

    ConnCreateWebSocket()
    {
        const WS_URL = document.URL.replace('http://', 'ws://').replace('https://', 'wss://');
        let conn = new WebSocket(WS_URL);

        conn.onopen = () => {
            console.log('+ WS Connection');

            const m: SocketMessage = {
                id: uuid(),
                command: SocketCommand.SUB,
                type: SocketCommandType.DOCUMENT,
                data: { 
                    id: this.block_id
                }
            }
            this.TrySendServer(m);
        };

        conn.onmessage = evt => {
            this.handleSocketMessage(evt);
        };

        conn.onclose = () => {
            console.log("- WS Disconnection");
            setTimeout(this.ConnCreateWebSocket.bind(this), 5000);
        };

        this.conn = conn
    }
    handleSocketMessage(event: MessageEvent) {
        const message: SocketMessage = JSON.parse(event.data);
        console.log(message);
        this.root_block_callback();
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

    }

    SocketProcessDocument(message: SocketMessage) {

    }

    SocketProcessSocial(message: SocketMessage) {

    }
}