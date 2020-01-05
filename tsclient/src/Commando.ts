import assert from "assert"
import * as localForage from "localforage"
import sha256 from "crypto-js/sha256"
import Base64 from "crypto-js/enc-base64"

import { PlayBlockState, PlayBlockType } from "./components/PlayBlock"
import { User } from "./User"
import { get_random_color } from "./components/Playbox"

const USER_BLOCK_ID = "RLM3"

export class Commando {
    block_id = ""
    block_store: LocalForage | null = null

    for_ui: {[key: string]: PlayBlockState} = {}
    
    selected_block_id = ""
    user: User | null = null 

    constructor(root_block_id: string) {
        this.user = new User(USER_BLOCK_ID, root_block_id)
        this.block_id = root_block_id
        this.selected_block_id = root_block_id
        this.block_store = localForage.createInstance({name: root_block_id})
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
}