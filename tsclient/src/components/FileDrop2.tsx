import * as React from "react"
import {PlayBlockState, PlayBlockType} from "./PlayBlock"
import {Commando} from  "../Commando"
import uuid from "uuid";

export interface FileDrop2Props {
    parent_block_id: string
    commando: Commando
}

export class FileDrop2 extends React.Component<FileDrop2Props> {

    getBase64(file: File) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
    }

    dropHandler(event: React.DragEvent) {
        event.preventDefault();
        // console.log("dragHandler");
        if (!event.dataTransfer.items) return;

        for (let i=0; i<event.dataTransfer.items.length; i++) {
            let item = event.dataTransfer.items[i];
            //console.log(item);
            if (item.kind !== "file") continue;

            let f = item.getAsFile();
            if (!f) return;

            this.getBase64(f).then(data => { 
                if (!f) return;
                let new_block: PlayBlockState = {
                    id: uuid(),
                    title: f.name,
                    type: PlayBlockType.FILE, 
                    value: data
                }

                this.props.commando.AddBlock(new_block, this.props.parent_block_id)
            });
        }

    }

    dragOverHandler(event: React.DragEvent) {
        //console.log("dragOver");
        event.preventDefault();
    }

    render() {
        return (
            <div 
                style={{width:"100%", height:"100%"}}
                className="fileDrop"
                onDrop={this.dropHandler.bind(this)}
                onDragOver={this.dragOverHandler.bind(this)}
            >
                {this.props.children}
            </div>
        );
    }
}