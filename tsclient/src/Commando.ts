import assert from "assert"
import * as localForage from "localforage"
import sha256 from "crypto-js/sha256"
import Base64 from "crypto-js/enc-base64"

import { PlayBlockState, PlayBlockType } from "./components/PlayBlock"
import { User } from "./User"

const USER_BLOCK_ID = "RLM3"

export class Commando {
    block_id = ""
    block_store: LocalForage | null = null

    user: User | null = null 

    constructor(root_block_id: string) {
        this.user = new User(USER_BLOCK_ID, root_block_id)
        this.block_id = root_block_id
        this.block_store = localForage.createInstance({name: root_block_id})
    }

    Dehydrate(b: PlayBlockState) {

       let sb = {...b}

       sb.md_deep = undefined 
       sb.md_shallow = undefined
       if (!this.block_store) return b

       let sb_json = JSON.stringify(sb)
       sb.md_shallow = Base64.stringify(sha256(sb_json))

       this.block_store.setItem(sb.id, sb)

       //todo send to server

       return sb
    }

    async Hydrate(id: string) {
        const ghost: PlayBlockState = {
            id: id,
            title: "Untitled",
            value: "...",
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