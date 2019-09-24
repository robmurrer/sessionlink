import React from 'react';
import PropTypes from 'prop-types';

function Block (props){
    return (
    <div className='block' 
        style={
            {
                backgroundColor: props.block_object.color, 
                left: props.block_object.x, 
                top: props.block_object.y,
                width: props.grid_size, 
                height: props.grid_size,
                //lineHeight: props.grid_size,
            }}>
    </div>
    );
}

export default Block;