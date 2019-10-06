import * as React from "react";
import * as ContentEditable from "react-contenteditable";
export interface BlockProps {
    id: string;
    title?: string;
    value?: any;
    color?: string;
    x?: number; 
    y?: number; 
    z?: number; 
    blocks? : {[key: string] : BlockProps},
    children?: React.ReactNode,
    commando?: Function,
    //blackboard?: React.RefObject<HTMLDivElement>,
    blackboard?: HTMLDivElement,
};

export class Block extends React.Component<BlockProps> {

    handleClick(event : React.MouseEvent) {
        //console.log("clicked on box");
        event.stopPropagation();
    }

    handleDragStart(event : React.DragEvent) {
        let dt = event.dataTransfer;
        dt.setData("text/plain", this.props.id);
    }


    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        if (!this.props.commando) return;
        let updated_block = {...this.props};
        updated_block.title = event.target.value;
        this.props.commando(updated_block);
    }


    render() {
        return (
            <div 
                className="Block" 
                style={{left: this.props.x, top: this.props.y, color: this.props.color}}
                draggable={true}
                onClick={this.handleClick.bind(this)}
                onDragStart={this.handleDragStart.bind(this)}
            >
                <h1>
                    <ContentEditable.default html={this.props.title || ""} onChange={this.handleTitleEdit.bind(this)} />
                </h1>
                <p>{this.props.value}</p>
                {this.props.children}
            </div>
        );
    }
}
