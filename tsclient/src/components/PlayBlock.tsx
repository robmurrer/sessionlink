import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import { Command } from "./Playbox";
import { Commando } from "../Commando";
import uuid from "uuid";
import assert from "assert";

export enum PlayBlockType {
    GHOST,
    TEXT,
    FILE,
}

export interface PlayBlockProps {
    id: string
    commando: Commando 
};

export interface PlayBlockState {
    id: string
    type?: PlayBlockType
    title?: string
    value?: any

    created?: number
    updated?: number

    // Geometry
    x?: number 
    y?: number 
    z?: number 
    w?: number
    h?: number

    color?: string
    selected?: boolean

    blocks?: string[]
    md_shallow?: string 
    md_deep?: string 
}

export class PlayBlock extends React.Component<PlayBlockProps, PlayBlockState> {
    BlockTitleRef = React.createRef<HTMLElement>()
    BlockContentRef = React.createRef<HTMLElement>()

    async componentDidMount() {
        let hydro = await this.props.commando.Hydrate(this.props.id)
        assert(hydro)

        this.setState(hydro)

        if (hydro.selected) {
            if (!this.BlockTitleRef.current) return
            this.BlockTitleRef.current.focus()
        }
    }

    highlightContent() { 
        setTimeout(() => { document.execCommand('selectAll', false)}, 0)
    }

    //we don't want Playbox to add another block at cursor click
    handleClick(event : React.MouseEvent) {
        event.stopPropagation()
    }

    // place block id in drag data transfer for playbox to update
    handleDragStart(event : React.DragEvent) {
        let dt = event.dataTransfer
        dt.setData("text/plain", this.state.id)
    }

    handleTitleEnter(event: React.KeyboardEvent) {
        if (event.keyCode === 13) {
            event.preventDefault()

            if (!this.BlockContentRef.current) return
            this.BlockContentRef.current.focus()
        }
    }


    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let updated_block = {...this.state}
        updated_block.title = event.target.value
        this.props.commando.Dehydrate(updated_block)
        this.setState(updated_block);
    }

    handleValueEdit(event: ContentEditable.ContentEditableEvent) {
        let updated_block = {...this.state}
        updated_block.value = event.target.value
        this.props.commando.Dehydrate(updated_block)
        this.setState(updated_block)
    }

    async handleAddBlockLink(event: React.MouseEvent) {
        event.preventDefault()
        const new_block_id = uuid()
        let new_block = await this.props.commando.Hydrate(new_block_id)
        new_block = this.props.commando.Dehydrate(new_block)

        let root_block = {...this.state}

        if (!root_block.blocks) root_block.blocks = []
        root_block.blocks.push(new_block_id)
        root_block = this.props.commando.Dehydrate(root_block)
        this.setState(root_block)
    }

    handleArchive(event: React.MouseEvent) {
    }

    handleDelete(event: React.MouseEvent) {
    }

    render() {
        if (!this.state) return null

        let cb = <ContentEditable.default 
                        innerRef={this.BlockContentRef}
                        //html={DOMPurify.sanitize(Marked.parse(String(this.props.value))) || ""} //guard value can be any?
                        //html={Marked.parse(String(this.props.value)) || ""} //guard value can be any?
                        html={String(this.state.value || "")} //guard value can be any?
                        onChange={this.handleValueEdit.bind(this)}
                        onFocus={this.highlightContent.bind(this)}
                />

        if (this.state.type) {
            let b64 = this.state.value as string;

            if (b64.startsWith("data:image/")) {
                cb = <img src={b64} />
            }
            else {
                cb = <a href={b64}>{this.state.title}</a>
            }
        }

        let children: string[] = []
        if (this.state.blocks) children = this.state.blocks.slice()
        children = children.reverse()

        return (
            <div 
                className="Block" 
                style={{
                    //left: this.props.x, 
                    //top: this.props.y, 
                    float: "left",
                    color: this.state.color,
                    border: "1px solid white"
                }}
                //draggable={true}
                onClick={this.handleClick.bind(this)}
                onDragStart={this.handleDragStart.bind(this)}
                onFocus={this.highlightContent.bind(this)}
            >
                <h1>
                    <ContentEditable.default 
                        innerRef={this.BlockTitleRef}
                        html={String(this.state.title || "")} 
                        onChange={this.handleTitleEdit.bind(this)} 
                        onFocus={this.highlightContent.bind(this)}
                        onKeyDown={this.handleTitleEnter.bind(this)}
                    />
                </h1>
                    <div className="Plusbar">
                        <a onClick={this.handleAddBlockLink.bind(this)} href="">+</a>
                    </div>
                <hr/>
                <div className="Content">
                    {cb}
                </div>
                <div className="Children">
                    {children.map(id => {return <PlayBlock key={id} id={id} commando={this.props.commando} />})}
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
