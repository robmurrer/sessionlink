import * as React from "react";
import * as ContentEditable from "react-contenteditable";
import { Commando } from "../Commando";
import uuid from "uuid";
import { getBase64 } from "../File";
import { SocketCommand, SocketCommandType, SocketMessage } from "./SocketMessage";
import { User } from "../User";
import { PlayBlockState, PlayBlockType } from "./ISessionLink";



export interface PlayBlockProps {
    id: string
    commando: Commando
    user: User
};


export class PlayBlock extends React.Component<PlayBlockProps, PlayBlockState> {
    BlockTitleRef = React.createRef<HTMLElement>()
    BlockContentRef = React.createRef<HTMLElement>()

    constructor(props: PlayBlockProps) {
        super(props)
        if (this.props.commando._block_id === this.props.id) {
            this.props.commando._root_block_callback = this.ExternalUpdate.bind(this)
        }
    }

    async ExternalUpdate(message: SocketMessage) {
        console.log(message)
    }

    async componentDidMount() {
        let hydro = await this.props.commando.Hydrate(this.props.id)

        this.setState(hydro)

        if (!this.BlockTitleRef.current) return
        if (this.props.commando._selected_block_id === this.props.id) {
            this.BlockTitleRef.current.focus()
        }
    }

    highlightContent() { 
        setTimeout(() => { document.execCommand('selectAll', false)}, 0)
    }

    handleClick(event : React.MouseEvent) {
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


    async handleTitleEdit(event: ContentEditable.ContentEditableEvent) {
        let updated_block = {...this.state}
        updated_block.title = event.target.value
        const s = await this.props.commando.Dehydrate(updated_block)
        this.setState(s)
    }

    async handleValueEdit(event: ContentEditable.ContentEditableEvent) {
        let updated_block = {...this.state}
        updated_block.value = event.target.value
        const s = await this.props.commando.Dehydrate(updated_block)
        this.setState(s)
    }

    async handleAddBlockLink(event: React.MouseEvent) {
        event.preventDefault()
        const new_block_id = uuid()
        const new_block = await this.props.commando.Hydrate(new_block_id)
        const parent = await this.props.commando.AddBlock(new_block, this.props.id)

        this.setState(parent)
    }

    async handleMouseMove(event: React.MouseEvent) {
        const m: SocketMessage = {
            id: uuid(),
            command: SocketCommand.PUB,
            type: SocketCommandType.SOCIAL,
            data: {
                id: this.props.user.GetId() || "boom",  
                title: this.props.user.GetNick(),
                color: this.props.user.GetColor(),
                value: "CursorMove",
                x: event.clientX,
                y: event.clientY,
            }
        }
        await this.props.commando.TrySendServer(m)
    }


    handleArchive(event: React.MouseEvent) {
    }

    handleDelete(event: React.MouseEvent) {
    }

    /*
    shouldComponentUpdate(nextProps: Readonly<PlayBlockProps>, nextState: Readonly<PlayBlockState>) {
            return true
    }
    */

    async dropHandler(event: React.DragEvent) {
        event.preventDefault();
        // console.log("dragHandler");
        if (!event.dataTransfer.items) return;

        for (let i=0; i<event.dataTransfer.items.length; i++) {
            let item = event.dataTransfer.items[i]
            //console.log(item);
            if (item.kind !== "file") continue

            let f = item.getAsFile()
            if (!f) return

            getBase64(f).then(async data => { 
                if (!f) return

                const new_block_id = uuid()
                let new_block = await this.props.commando.Hydrate(new_block_id)
                new_block.title = f.name
                new_block.type = PlayBlockType.FILE
                new_block.value = data

                const parent = await this.props.commando.AddBlock(new_block, this.props.id)
                this.setState(parent)
            })
        }

        event.stopPropagation()
    }

    dragOverHandler(event: React.DragEvent) {
        //console.log("dragOver");
        event.preventDefault()
    }

    render() {
        let s = {...this.state}
        let cb = <ContentEditable.default 
                        innerRef={this.BlockContentRef}
                        //html={DOMPurify.sanitize(Marked.parse(String(this.props.value))) || ""} //guard value can be any?
                        //html={Marked.parse(String(this.props.value)) || ""} //guard value can be any?
                        html={String(s.value || "")} //guard value can be any?
                        onChange={this.handleValueEdit.bind(this)}
                        onFocus={this.highlightContent.bind(this)}
                />

        if (s.type) {
            let b64 = s.value as string

            if (b64.startsWith("data:image/")) {
                cb = <img src={b64} />
            }
            else {
                cb = <a href={b64}>{s.title}</a>
            }
        }

        let children: string[] = []
        if (s.blocks) children = s.blocks.slice()
        children = children.reverse()

        let styles: React.CSSProperties =  {
                   //left: this.props.x, 
                    //top: this.props.y, 
                    float: "left",
                    color: s.color,
                    //border: (this.props.id === this.props.commando.selected_block_id ? "1px solid " + this.state.color : ""),
                    maxWidth: (s.id === this.props.commando._block_id ? "100%" : "666px"),
                    width: (s.id === this.props.commando._block_id ? "100%" : undefined),
                    height: (s.id === this.props.commando._block_id ? "100%" : undefined)
                }
        return (
            <div 
                className="Block" 
                style={styles}
                //draggable={true}
                onClick={this.handleClick.bind(this)}
                onDragStart={this.handleDragStart.bind(this)}
                onFocus={this.highlightContent.bind(this)}
                onDrop={this.dropHandler.bind(this)}
                onDragOver={this.dragOverHandler.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
            >
                
                <h1>
                    <ContentEditable.default 
                        innerRef={this.BlockTitleRef}
                        html={String(s.title || "")} 
                        onChange={this.handleTitleEdit.bind(this)} 
                        onFocus={this.highlightContent.bind(this)}
                        onKeyDown={this.handleTitleEnter.bind(this)}
                    />
                </h1>
                    <div className="Plusbar">
                        <a style={{color: s.color}} onClick={this.handleAddBlockLink.bind(this)} href="">+</a>
                    </div>
                <hr/>
                <div className="Content">
                    {cb}
                </div>
                <div className="Children">
                    {children.map(id => {return <PlayBlock key={id} id={id} user={this.props.user} commando={this.props.commando} />})}
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
        )
    }
}
