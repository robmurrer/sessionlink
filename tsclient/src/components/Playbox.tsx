import * as React from "react";
import { Block, BlockProps } from "./Block";
import * as ContentEditable from "react-contenteditable";
import uuid from "uuid";

export interface PlayboxProps {
    block: BlockProps
};

export interface PlayboxState {
    block: BlockProps
};

enum Command {
    Update,
    Delete,
}


function LoadState(props : PlayboxProps) {
    let state : PlayboxState = { block: props.block };

    return state;
}

export class Playbox extends React.Component<PlayboxProps, PlayboxState> {
    readonly state : PlayboxState = LoadState(this.props);
    BlackboardRef = React.createRef<HTMLDivElement>();

    Commando(updated_block : BlockProps, command : Command) {
        let block = {...this.state.block};
        if (!block.blocks) block.blocks = {};
        block.blocks[updated_block.id] = updated_block;

        this.setState({block})
    }

    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let new_title = event.target.value;
        let block = {...this.state.block};
        block.title = new_title;
        this.setState({block});
    }

    handleClick(event : React.MouseEvent) {
        const blackboard = this.BlackboardRef.current;
        if (!blackboard) return;
        
        const rel_pos = blackboard.getBoundingClientRect();
        const new_block : BlockProps = {
            id: uuid(),
            title: "Untitled",
            value: Date.now(),
            x: event.clientX - rel_pos.left,
            y: event.clientY - rel_pos.top,
        };
    
        let block = {...this.state.block};
        if (!block.blocks) block.blocks = {};

        block.blocks[new_block.id] = new_block;

        this.setState({block}); 
    }

    handleDrag(event: React.DragEvent) {
        event.preventDefault();
    }

    render() {
        let blocks: {[key: string]: BlockProps} = {};
        if (this.state.block.blocks) blocks = this.state.block.blocks;

        return (
            <div className="Playbox">
                <h1>
                    <ContentEditable.default html={this.state.block.title || ""} onChange={this.handleTitleEdit.bind(this)} /></h1>
                <div ref={this.BlackboardRef} className="Blackboard" onClick={this.handleClick.bind(this)} onDragOver={this.handleDrag.bind(this)}>
                    {Object.entries(blocks).map(([key, b]) => {
                        return <Block key={b.id} {...b} blackboard={this.BlackboardRef.current || undefined} commando={this.Commando.bind(this)} />;
                    })}
                </div>
            </div>
        );
    }
}