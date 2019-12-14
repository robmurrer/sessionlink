import * as React from "react"
import {BlockProps} from "./Block"
import { blockStatement } from "@babel/types";

export interface CursorProps {
    data: BlockProps
}

export class Cursor extends React.Component<CursorProps> {
    render() {
        return (
            <aside style={
                {
                    backgroundColor: this.props.data.color, 
                    position: "absolute",
                    left: this.props.data.x,
                    top: this.props.data.y,
                }

            }>{this.props.data.id.substring(0,13)}</aside>
        );
    }
}