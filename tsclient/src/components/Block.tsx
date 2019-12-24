import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import { Command } from "./Playbox";

export enum BlockTypes {
    TEXT,
    FILE,
}

export interface BlockProps {
    id: string;
    title?: string;
    value?: any;
    created?: number;
    updated?: number;

    type?: BlockTypes;

    // Geometry
    x?: number; 
    y?: number; 
    z?: number; 

    // Colors
    color?: string;

    // Update callback :)
    commando?: Function,

    //blocks under management
    blocks?: string[],

    innerRef?: React.RefObject<HTMLElement> | Function | null;

    selected?: boolean;
};

export class Block extends React.Component<BlockProps> {
    BlockTitle = React.createRef<HTMLElement>();
    BlockContent = React.createRef<HTMLElement>();

    componentDidMount() {
        if (this.props.selected) {
            if (!this.BlockTitle.current) return;
            this.BlockTitle.current.focus();
        }
    }

    highlightContent() { 
        setTimeout(() => { document.execCommand('selectAll', false)}, 0);
    }

    //we don't want Playbox to add another block at cursor click
    handleClick(event : React.MouseEvent) {
        event.stopPropagation();
    }

    // place block id in drag data transfer for playbox to update
    handleDragStart(event : React.DragEvent) {
        let dt = event.dataTransfer;
        dt.setData("text/plain", this.props.id);
    }

    handleTitleEnter(event: React.KeyboardEvent) {
        if (event.keyCode === 13) {
            event.preventDefault();

            if (!this.BlockContent.current) return;
            this.BlockContent.current.focus();
        }
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

    handleArchive(event: React.MouseEvent) {
        if (!this.props.commando) return;
        this.props.commando(this.props, Command.Archive)
    }

    handleDelete(event: React.MouseEvent) {
        if (!this.props.commando) return;
        this.props.commando(this.props, Command.Delete)
    }
    render() {
        let cb = <ContentEditable.default 
                        innerRef={this.BlockContent}
                        html={String(this.props.value) || ""} //guard value can be any?
                        onChange={this.handleValueEdit.bind(this)}
                        onFocus={this.highlightContent.bind(this)}
                />;

        if (this.props.type) {
            let b64 = this.props.value as string;

            if (b64.startsWith("data:image/")) {
                cb = <img src={b64} />
            }
        }

        return (
            <div 
                className="Block" 
                style={{
                    //left: this.props.x, 
                    //top: this.props.y, 
                    float: "left",
                    color: this.props.color,
                    border: "1px solid " + this.props.color,
                }}
                //draggable={true}
                onClick={this.handleClick.bind(this)}
                onDragStart={this.handleDragStart.bind(this)}
                onFocus={this.highlightContent.bind(this)}
            >
                <h1>
                    <ContentEditable.default 
                        innerRef={this.BlockTitle}
                        html={String(this.props.title || "")} 
                        onChange={this.handleTitleEdit.bind(this)} 
                        onFocus={this.highlightContent.bind(this)}
                        onKeyDown={this.handleTitleEnter.bind(this)}
                    />
                </h1>
                <hr/>
                <div className="Content">
                    {cb}
                </div>
                <div style={{display: "none"}} className="Controls">
                    <button 
                        className="ArchiveButton" 
                        onClick={this.handleArchive.bind(this)}
                    >
                        Archive
                    </button>
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
