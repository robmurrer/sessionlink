import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import { Command } from "./Playbox";

export interface BlockProps {
    id: string;
    title?: string;
    value?: any;
    created?: number;

    // Geometry
    x?: number; 
    y?: number; 
    z?: number; 

    // Colors
    color?: string;
    bg_color?: string;

    // Update callback :)
    commando?: Function,

    // Like Children but dictionary database
    // only used for root blocks right now
    blocks?: {[key: string] : BlockProps},
};

export class Block extends React.Component<BlockProps> {

    //we don't want Playbox to add another block at cursor click
    handleClick(event : React.MouseEvent) {
        event.stopPropagation();
    }

    // place block id in drag data transfer for playbox to update
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

    handleValueEdit(event: ContentEditable.ContentEditableEvent) {
        if (!this.props.commando) return;
        let updated_block = {...this.props};
        updated_block.value = event.target.value;
        this.props.commando(updated_block);
    }

    handleDelete(event: React.MouseEvent) {
        if (!this.props.commando) return;
        this.props.commando(this.props, Command.Delete)
    }

    render() {
        return (
            <div 
                className="Block" 
                style={{
                    left: this.props.x, 
                    top: this.props.y, 
                    color: this.props.color,
                    borderColor: this.props.color,
                }}

                draggable={true}
                onClick={this.handleClick.bind(this)}
                onDragStart={this.handleDragStart.bind(this)}
            >
                <h1>
                    <ContentEditable.default 
                        html={String(this.props.title || "")} 
                        onChange={this.handleTitleEdit.bind(this)} 
                    />
                </h1>
                <hr/>
                <div className="Content">
                    <ContentEditable.default 
                        html={String(this.props.value) || ""} //guard value can be any?
                        onChange={this.handleValueEdit.bind(this)}
                    />
                </div>
                <div className="Controls">
                    <button 
                        className="DeleteButton" 
                        onClick={this.handleDelete.bind(this)}
                    >
                        Delete
                    </button>
                </div>

                {this.props.children}
            </div>
        );
    }
}
