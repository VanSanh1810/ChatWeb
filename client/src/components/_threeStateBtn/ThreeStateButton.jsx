import React, { useEffect, useMemo, useState } from 'react';
import './threeStateBtn.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ThreeStateButton(props) {
    return (
        <div className="three_state_btn">
            <div
                className={props.defautValue === false ? 'three_state_btn_no selected' : 'three_state_btn_no'}
                onClick={() => {
                    props.changeValue(false);
                }}
            >
                <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </div>
            <div
                className={props.defautValue === 'unset' ? 'three_state_btn_unset selected' : 'three_state_btn_unset'}
                onClick={() => {
                    props.changeValue('unset');
                }}
            >
                <FontAwesomeIcon icon="fa-solid fa-0" />
            </div>
            <div
                className={props.defautValue === true ? 'three_state_btn_yes selected' : 'three_state_btn_yes'}
                onClick={() => {
                    props.changeValue(true);
                }}
            >
                <FontAwesomeIcon icon="fa-solid fa-check" />
            </div>
        </div>
    );
}

export default ThreeStateButton;
