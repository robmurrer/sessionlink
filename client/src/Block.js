import React from 'react';
import PropTypes from 'prop-types';

function Block (props){
    return (
    <div className='block' style={{backgroundColor: props.color, left: props.x, top: props.y}}></div>
    );
}

export default Block;