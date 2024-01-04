import React from 'react';
import './switch.css';

function Switch(props) {
    return (
        <label className="switch">
            <input
                checked={props.defautData ? props.defautData : false}
                type="checkbox"
                onChange={() => props.switchToggleData()}
            />
            <span className="slider round"></span>
        </label>
    );
}

export default Switch;
