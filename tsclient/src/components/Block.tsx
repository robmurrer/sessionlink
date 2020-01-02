import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import { Command } from "./Playbox";
import * as DOMPurify from "dompurify";
import * as Marked from "marked";

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

    mdshallow?: string, //no contents of children
    mddeep?: string, //full contents of entire tree

    innerRef?: React.RefObject<HTMLElement> | Function | null;

    selected?: boolean;
};

export class Block extends React.Component<BlockProps> {
    //BlockRef = React.createRef<HTMLElement>(); //can't use?
    BlockTitleRef = React.createRef<HTMLElement>();
    BlockContentRef = React.createRef<HTMLElement>();

    componentDidMount() {
        if (this.props.selected) {
            if (!this.BlockTitleRef.current) return;
            this.BlockTitleRef.current.focus();
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

            if (!this.BlockContentRef.current) return;
            this.BlockContentRef.current.focus();
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
                        innerRef={this.BlockContentRef}
                        //html={DOMPurify.sanitize(Marked.parse(String(this.props.value))) || ""} //guard value can be any?
                        //html={Marked.parse(String(this.props.value)) || ""} //guard value can be any?
                        html={String(this.props.value) || ""} //guard value can be any?
                        onChange={this.handleValueEdit.bind(this)}
                        onFocus={this.highlightContent.bind(this)}
                />;

        if (this.props.type) {
            let b64 = this.props.value as string;

            if (b64.startsWith("data:image/")) {
                cb = <img src={b64} />
            }
            else {
                cb = <a href={b64}>{this.props.title}</a>
            }
        }

        return (
            <div 
                //innerRef={this.BlockRef}
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
                        innerRef={this.BlockTitleRef}
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
