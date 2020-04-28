import {BlockProps} from "./Block"
import { PlayBlockProps, PlayBlockState } from "./PlayBlock";

export enum SocketCommand {
    PUB,
    UNPUB,
    SUB,
    UNSUB,
}

export enum SocketCommandType {
    DOCUMENT,
    SOCIAL
}

export interface SocketMessage {
    id: string
    command: SocketCommand
    type: SocketCommandType
    data: PlayBlockState 
}

export interface SocketMessage_LEGACY {
    id: string
    command: SocketCommand
    type: SocketCommandType
    data: BlockProps 
}