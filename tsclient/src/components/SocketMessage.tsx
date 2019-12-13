import {BlockProps} from "./Block"

//publish/subscribe
export enum SocketCommand {
    PUB,
    SUB,
}

export enum SocketCommandType {
    DOCUMENT,
    SOCIAL
}

export interface SocketMessage {
    id: string,
    command: SocketCommand,
    type: SocketCommandType,
    data: BlockProps 
}

