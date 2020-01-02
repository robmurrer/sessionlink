import * as localForage from "localforage"
import uuid from "uuid"

const ID = "ID"

export class User {
    store: LocalForage | null = null
    constructor(prefix: string, block_id: string) {
        this.store = localForage.createInstance({name: prefix+block_id })
    }

    async GetId() {
        if (!this.store) return;

        try {
            const id = await this.store.getItem(ID) as string
            return id;
        }
        catch {
            const id = uuid()
            this.store.setItem(ID, id);
            return id;
        }
    }

    GetNick() {

    }

    SetNick(nickname: string) {

    }

    GetColor() {

    }

    SetColor(c: string) {

    }
}