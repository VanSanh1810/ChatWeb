import React, { useEffect, useState } from 'react';
import './emojiSelector.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../configs/axiosConfig';
import axios from 'axios';

function EmojiSelector(props) {
    const emojiCategory = [
        'smileys-emotion',
        'people-body',
        'component',
        'animals-nature',
        'food-drink',
        'travel-places',
        'activities',
        'objects',
        'symbols',
        'flags',
    ];
    const [searchData, setSearchData] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(emojiCategory[0]);

    useEffect(() => {
        const element = document.getElementById(selectedCategory);
        element.scrollIntoView();
    }, [selectedCategory]);

    const handleInputChange = (e) => {
        setSearchData(e.target.value);
    };

    return (
        <div className="emoji_main">
            <div className="emoji_searchForm">
                <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                <input type="text" placeholder="Search Emoji" defaultValue={searchData} onChange={handleInputChange} />
            </div>
            <div className="emoji_data">
                {searchData
                    ? null
                    : emojiCategory.map((category, index) => {
                          return (
                              <>
                                  <label key={index} id={category}>
                                      {category}
                                  </label>
                                  <EmojiCategoryContainer category={category} addEmo={props.addEmo} />
                              </>
                          );
                      })}
                {searchData ? <EmojiSearchContainer searchData={searchData} /> : null}
            </div>
            <div style={searchData ? { display: 'none' } : {}} className="emoji_category">
                <button
                    className={selectedCategory === emojiCategory[0] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[0])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-face-smile" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[1] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[1])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-person" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[2] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[2])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-lightbulb" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[3] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[3])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-dog" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[4] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[4])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-utensils" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[5] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[5])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-car" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[6] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[6])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-person-swimming" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[7] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[7])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-hockey-puck" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[8] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[8])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-icons" />
                </button>
                <button
                    className={selectedCategory === emojiCategory[9] ? 'selected' : ''}
                    onClick={() => setSelectedCategory(emojiCategory[9])}
                >
                    <FontAwesomeIcon icon="fa-solid fa-flag" />
                </button>
            </div>
        </div>
    );
}

export default EmojiSelector;

function EmojiCategoryContainer(props) {
    const [listEmo, setListEmo] = useState([]);
    useEffect(() => {
        axios
            .get(`https://emoji-api.com/categories/${props.category}?access_key=${import.meta.env.VITE_CLIENT_EMOJI_KEY}`)
            .then((response) => {
                setListEmo(response.data);
            });
    }, [props.category]);

    function unicodeToChar(text) {
        return text.replace(/\\u[\dA-F]{4}/gi, function (match) {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
    }

    return (
        <div className="emo_cate_container">
            {listEmo?.map((emo, index) => {
                return (
                    <div key={index} className="emo-item" onClick={() => props.addEmo(emo.character)}>
                        {unicodeToChar(emo.character)}
                    </div>
                );
            })}
        </div>
    );
}

function EmojiSearchContainer(props) {
    const [listEmo, setListEmo] = useState([]);
    useEffect(() => {
        axios
            .get(`https://emoji-api.com/emojis?search=${props.searchData}&access_key=${import.meta.env.VITE_CLIENT_EMOJI_KEY}`)
            .then((response) => {
                setListEmo(response.data);
            });
    }, [props.searchData]);

    function unicodeToChar(text) {
        return text.replace(/\\u[\dA-F]{4}/gi, function (match) {
            return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
    }

    return (
        <div className="emo_cate_container">
            {listEmo.length >= 0
                ? listEmo?.map((emo, index) => {
                      return (
                          <div key={index} className="emo-item" onClick={() => props.addEmo(emo.character)}>
                              {unicodeToChar(emo.character)}
                          </div>
                      );
                  })
                : null}
        </div>
    );
}
