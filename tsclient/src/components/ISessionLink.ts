
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

    innerRef?: any;//React.RefObject<HTMLElement> | Function | null;

    selected?: boolean;
};

export enum PlayBlockType {
    GHOST,
    STOMPED,
    TEXT,
    FILE, //CSV to DATATABLE...
    LIST,
    TABLE,
    CALENDAR,
}

export interface PlayBlockState {
    id: string
    type?: PlayBlockType
    title?: string
    value?: any
    url?: string

    // Geometry
    x?: number 
    y?: number 
    z?: number 
    w?: number
    h?: number
    color?: string

    blocks?: string[]
}