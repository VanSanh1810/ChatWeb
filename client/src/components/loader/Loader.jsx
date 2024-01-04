import React from 'react';
import './loader.css';

function Loader(props) {
    
    return (
        <>
            <div className={props.loader_color === '1' ? "sk-chase load1" : "sk-chase load2"}>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
            </div>
        </>
    );
}

export default Loader;
