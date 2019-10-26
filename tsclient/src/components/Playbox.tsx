/*  Playbox React Component
    Copyright 2019 Rob Murrer - All Rights Reserved
    No Warranty - Not Fit for Public Consumption

    Pass in Root Block and Watch it Go.
*/
import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import uuid from "uuid";
import * as localForage from "localforage";

import { FileDrop, } from "./FileDrop";
import { Block, BlockProps } from "./Block";
import { ReadAfterDestroyedError } from "fs-capacitor";
import { identifier } from "@babel/types";
import { string } from "prop-types";

export interface PlayboxProps {
    block: BlockProps,
};

enum PlayboxStates {
    HYDRATING, //serialize from local copy... kids these days
    OFFLINE_SERVER, 
    CONNECTING_SERVER,
    SYNCING_SERVER,
    REBOUND_SERVER,
    ERROR,
}

export interface PlayboxState {
    state: PlayboxStates,
    root_block: BlockProps,
    store: LocalForage,
    blocks: {[key: string]: BlockProps},
    offline: boolean,
    //next_x: number,
    //next_y: number,
    cursor_x?: number,
    cursor_y?: number,
    selected_block?: string,
};

export enum Command {
    Init,
    Update,
    Delete,
    Archive,
}

const PUSH_X = 300;
const OFFSET_XY = 30;
function GetDefaultState(props: PlayboxProps) {

    let state: PlayboxState = { 
        state: PlayboxStates.HYDRATING,
        root_block: props.block,
        blocks: {},
        store: localForage.createInstance({name: props.block.id}),
        //next_x: OFFSET_XY, 
        //next_y: OFFSET_XY,
        offline: true,
    };

    state.root_block.title = state.root_block.title || "";

    return state;
}



export class Playbox extends React.Component<PlayboxProps, PlayboxState> {
    BlackboardRef = React.createRef<HTMLDivElement>();
    RootBlockTitle = React.createRef<HTMLElement>();
    SelectedBlock = React.createRef<HTMLElement>(); 

    constructor(props: PlayboxProps) {
        super(props);
        this.state = GetDefaultState(this.props);
    }

    DehydrateBlock(block: BlockProps) {
        let new_block = block;
        delete new_block.commando; //cannot clone with function props
        this.state.store.setItem(block.id, block);
    }

    async HydrateBlock(id: string) {
        let result: {[key:string]: BlockProps} = {};
        let blockchain: BlockProps = {id: id, blocks: []}; 

        try {
            blockchain = await this.state.store.getItem(id) as BlockProps;
        }
        catch {
            console.log("! block not in store")
        }

        if (!blockchain) {
            blockchain = {
                id: id,
                title: "Untitled",
                blocks: [],
            }
        }

        result[id] = blockchain;

        if (blockchain.blocks) {
            for (let i=0; i<blockchain.blocks.length; i++) {
                let children = await this.HydrateBlock(blockchain.blocks[i]);
                result = Object.assign({}, result, children);
            }
        }
        return result;
    }


    async componentDidMount() {
        let new_state = {...this.state};

        new_state.blocks = await this.HydrateBlock(new_state.root_block.id);
        new_state.root_block = new_state.blocks[new_state.root_block.id];

        //remove root block from blockchain!
        console.log(new_state);
        delete new_state.blocks[new_state.root_block.id];

        this.setState(new_state);

        //select root block's title
        if (this.RootBlockTitle.current === null) return
        this.RootBlockTitle.current.focus();
    }

    handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let new_title = event.target.value;
        let state = {...this.state};
        state.root_block.title = new_title;
        this.setState(state);
        this.DehydrateBlock(state.root_block);
    }

    highlightTitle() {
        setTimeout(() => { document.execCommand('selectAll', false)}, 0);
    }

    handleAddBlockLink(event: React.MouseEvent) {
        console.log("Add block");
        event.preventDefault();

        let state = {...this.state};

        let new_block: BlockProps = {
            id: uuid(),
            title: "Untitled",
            value: "Write something good...", 
            //x: state.next_x,
            //y: state.next_y,
        }

        state.selected_block = new_block.id;

        if (!state.root_block.blocks) state.root_block.blocks = [];
        state.root_block.blocks.push(new_block.id);

        if (!state.blocks) state.blocks = {};
        state.blocks[new_block.id] = new_block;

        //state.next_x = state.next_x + PUSH_X;

        this.setState(state);
        this.DehydrateBlock(new_block);
        this.DehydrateBlock(state.root_block)

        if (this.SelectedBlock.current !== null) {
            this.SelectedBlock.current.focus();
        }
    }

    handleClick(event: React.MouseEvent) {
        console.log("Click");

    }

    handleCommando(block: BlockProps, command: Command = Command.Update) {
        //console.log("Commando!");
        let state = {...this.state};

        switch (command) {
            case Command.Update:
                state.blocks[block.id] = block;
                this.DehydrateBlock(block);
            break;
        }

        this.setState(state);
    }

    render() {
        return (
            <FileDrop store={this.state.store}>
                <div className="Playbox">
                    <h1>
                        <ContentEditable.default 
                            innerRef={this.RootBlockTitle}
                            html={this.state.root_block.title || ""}
                            onChange={this.handleTitleEdit.bind(this)} 
                            onFocus={this.highlightTitle.bind(this)}
                        />
                    </h1>
                    <div className="Plusbar">
                        <a onClick={this.handleAddBlockLink.bind(this)} href="">+</a>
                    </div>
                    <hr/>
                    <div ref={this.BlackboardRef} className="Blackboard" onClick={this.handleClick.bind(this)}>
                            {Object.entries(this.state.blocks || {}).map(([key, b]) => {
                                let ref = null;
                                let selected = false;
                                if (this.state.selected_block !== null) {
                                   if (b.id === this.state.selected_block) {
                                        ref = this.SelectedBlock;
                                        selected = true;
                                   } 
                                }
                                return <Block innerRef={ref} selected={selected} key={b.id} {...b} commando={this.handleCommando.bind(this)}/>;
                            })}
                    </div>
                    {this.props.children}
                </div>
            </FileDrop>
        );
    }
}