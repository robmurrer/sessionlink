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

export enum Command {
    Update,
    Delete,
}


//todo load state from indexedb based on block id
function LoadState(props: PlayboxProps) {
    let state: PlayboxState = { block: props.block };

    return state;
}

export class Playbox extends React.Component<PlayboxProps, PlayboxState> {
    readonly state: PlayboxState = LoadState(this.props);
    BlackboardRef = React.createRef<HTMLDivElement>();

    //command function that is passed to all blocks and they call this
    //default command is update
    Commando(updated_block: BlockProps, command: Command = Command.Update) {
        let block = {...this.state.block};
        if (!block.blocks) block.blocks = {};
        
        switch (command) {
            case Command.Update:
                block.blocks[updated_block.id] = updated_block;
                break;
            case Command.Delete:
                delete block.blocks[updated_block.id]
                break;
            default:
                console.log("! Unknown command type");
                break;
        }

        this.setState({block})
    }

    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let new_title = event.target.value;
        let block = {...this.state.block};
        block.title = new_title;
        this.setState({block});
    }

    //todo center on mouse with width of default block (at top left right now)
    //know the highest z-index and increment it so that new blocks are always on top?
    handleClick(event : React.MouseEvent) {
        const blackboard = this.BlackboardRef.current;
        if (!blackboard) return;
        
        const rel_pos = blackboard.getBoundingClientRect();
        const new_block : BlockProps = {
            id: uuid(),
            title: "Untitled",
            value: "Content...",
            created: Date.now(),

            color: "Yellow",

            x: event.clientX - rel_pos.left,
            y: event.clientY - rel_pos.top,
        };
    
        let block = {...this.state.block};
        if (!block.blocks) block.blocks = {};

        block.blocks[new_block.id] = new_block;

        this.setState({block}); 
    }

    //critical to prevent browser from snapping back drag on block
    handleDrag(event: React.DragEvent) {
        event.preventDefault();
    }

    handleDrop(event: React.DragEvent) {
        let block = {...this.state.block};

        if (!block.blocks) return; //never going to happen, but typescript :)
        if (!this.BlackboardRef.current) return;

        const block_id = event.dataTransfer.getData("text/plain");
        const rel_pos = this.BlackboardRef.current.getBoundingClientRect();
        
        block.blocks[block_id].x = event.clientX - rel_pos.left;
        block.blocks[block_id].y = event.clientY - rel_pos.top;

        this.setState({block}); 
    }

    render() {
        let blocks: {[key: string]: BlockProps} = {};
        if (this.state.block.blocks) blocks = this.state.block.blocks;

        return (
            <div className="Playbox">
                <h1>
                    <ContentEditable.default 
                        html={String(this.state.block.title) || ""} 
                        onChange={this.handleTitleEdit.bind(this)} 
                    />
                </h1>
                <div 
                    ref={this.BlackboardRef} 
                    className="Blackboard" 
                    onClick={this.handleClick.bind(this)} 
                    onDragOver={this.handleDrag.bind(this)}
                    onDrop={this.handleDrop.bind(this)}>
                        {Object.entries(blocks).map(([key, b]) => {
                            return <Block key={b.id} {...b} commando={this.Commando.bind(this)} />;
                        })}
                </div>
                {this.props.children}
            </div>
        );
    }
}