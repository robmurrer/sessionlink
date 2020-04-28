import * as localForage from "localforage"
import uuid from "uuid"
import { get_random_color } from "./Color"

const ID = "ID"
const NICK = "NICK"
const COLOR = "COLOR"

export class User {
    _store: LocalForage 
    _id?: string 
    _nick?: string 
    _color?: string 

    private constructor() {
        this._store = localForage.createInstance({name: "USER" })
    }

    static Create() {
        let r = new User()
        r._GetId()
        r._GetNick()
        r._GetColor()

        return r
    }

    GetId() {
        return this._id
    }

    GetNick() {
        return this._nick
    }

    GetColor() {
        return this._color
    }

    async _GetId() {
        if (!this._store) return "";
        if (this._id !== null) return this._id

        try {
            this._id = await this._store.getItem(ID) as string
            return this._id;
        }
        catch {
            this._id = uuid()
            this._store.setItem(ID, this._id);
            return this._id;
        }
    }

    async _GetNick() {
        if (!this._store) return "";
        if (this._nick !== null) return this._nick

        try {
            this._nick = await this._store.getItem(NICK) as string
            return this._nick
        }
        catch {
            this._nick = uuid()
            this._store.setItem(ID, this._id);
            return this._nick;
        }
    }

    async _GetColor() {
        if (!this._store) return "";
        if (this._color !== null) return this._color

        try {
            this._color = await this._store.getItem(COLOR) as string
            return this._color
        }
        catch {
            this._color = get_random_color()[1]
            this._store.setItem(COLOR, this._color)
            return this._color
        }
    }

    SetNick(name: string) {
        if (!this._store) return
        this._nick = name
        this._store.setItem(COLOR, this._nick)
    }

    SetColor(c: string) {
        if (!this._store) return
        this._color = c 
        this._store.setItem(COLOR, this._color)
    }
}