import * as React from "react";

export interface FileDropProps {
 store: LocalForage,
}


export class FileDrop extends React.Component<FileDropProps> {

    constructor(props: FileDropProps) {
        super(props);
    }

    dropHandler(event: React.DragEvent) {
        event.preventDefault();
        // console.log("dragHandler");
        if (!event.dataTransfer.items) return;

        for (let i=0; i<event.dataTransfer.items.length; i++) {
            let item = event.dataTransfer.items[i];
            //console.log(item);
            if (item.kind !== "file") continue;
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