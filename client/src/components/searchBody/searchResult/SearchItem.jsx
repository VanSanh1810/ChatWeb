import React from 'react';
import './searchItem.css';

function SearchItem(props) {
    const onSelect = () => {
        props.setSelectUser(props.infoData.userID);
    }

    return (
        <>
            <div className="searchSuggest__item" onClick={onSelect}>
                <img src={props.infoData.img} />
                <div className="searchSuggest__item_text">
                    <span>{props.infoData.name}</span>
                    <span>{props.infoData.userID}</span>
                </div>
            </div>
        </>
    );
}

export default SearchItem;
