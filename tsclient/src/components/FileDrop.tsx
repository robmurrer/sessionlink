import * as React from "react"
import { BlockProps, BlockTypes } from "./ISessionLink"
import uuid from "uuid"
import { Command } from "./Playbox"

import { getBase64, downscaleImage } from '../File'

export interface FileDropProps {
 commando: Function,
}

//todo extract the breakpoints for scaling and sizing
export class FileDrop extends React.Component<FileDropProps> {
    constructor(props: FileDropProps) {
        super(props)
    }

    async pasteHandler(event: any) {
        let new_event = {...event}
        new_event.dataTransfer = {}
        new_event.preventDefault = () => {}
        new_event.dataTransfer.items = (event.clipboardData || event.originalEvent.clipboardData).items

        if (new_event.dataTransfer.items.length === 1 && new_event.dataTransfer.items[0].type === "text") {
            event.preventDefault()
            return
        }

        this.dropHandler(new_event); //what are you doing with your life?
    }


    async dropHandler(event: React.DragEvent) {
        event.preventDefault()
        if (!event.dataTransfer.items) return

        for (let i=0; i<event.dataTransfer.items.length; i++) {
            let item = event.dataTransfer.items[i]
            if (item.kind !== "file") continue

            let f = item.getAsFile()
            if (!f) return

            let stomp = false
            if (f.size > 100*1024) { //100 kilobytes?
                console.log('$ Stomping on a file w/ size: ', f.size / 1e6, " ~ megabytes")
                if (f.type.startsWith("image")) {
                    stomp = true
                } //todo more ways of stomping (tail/head of txt etc)
                else {
                    console.log('$ Impossible stomp :( send <3 and $ to cryptide.com')
                    return
                }
            }

            getBase64(f).then(data => { 
                if (stomp) {
                    downscaleImage(data as string, "image/png", 600, .99).then(data => {
                        if (!f) return //typescript :P
                        console.log('$ New size ', (new Blob([data])).size / 1e6, " ~ megabytes")

                        let new_block: BlockProps = {
                            id: uuid(),
                            title: f.name,
                            type: BlockTypes.FILE,
                            value: data 
                        }

                        this.props.commando(new_block, Command.Create)
                    })

                    return
                }

                //repeats :(
                if (!f) return
                let new_block: BlockProps = {
                    id: uuid(),
                    title: f.name,
                    type: BlockTypes.FILE,
                    value: data 
                }

                this.props.commando(new_block, Command.Create)
            })
        }
    }

    dragOverHandler(event: React.DragEvent) {
        //console.log("dragOver");
        event.preventDefault()
    }

    render() {
        return (
            <div 
                style={{width:"100%", height:"100%"}}
                className="fileDrop"
                onDrop={this.dropHandler.bind(this)}
                onDragOver={this.dragOverHandler.bind(this)}
                onPaste={this.pasteHandler.bind(this)}
            >
                {this.props.children}
            </div>
        );
    }
}