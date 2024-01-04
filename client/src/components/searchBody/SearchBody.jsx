import React, { useState, useEffect, useRef } from 'react';
import './searchBody.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SearchItem from './searchResult/SearchItem';
import SearchData from './searchData/SearchData';
import axios from 'axios';
import { useSelector } from 'react-redux';
import Loader from '../loader/Loader';
import axiosInstance from '../../configs/axiosConfig';

function SearchBody() {
    const [selectUser, setSelectUser] = useState('');
    const [searchData, setSearchData] = useState('');
    const [suggestData, setSuggestData] = useState([]);

    const [suggestLoading, setSuggestLoading] = useState(false);

    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const searchInputRef = useRef(null);

    const onChangeSuggest = (e) => {
        setSearchData(e.target.value);
    };

    useEffect(() => {
        const getDataFromSearch = async () => {
            setSuggestData('');
            if (searchData) {
                setSuggestLoading(true);
                try {
                    const { data } = await axiosInstance.post('/api/getUsers', { idToken: userToken, searchData: searchData });
                    setSuggestData(data);
                } catch (error) {
                    console.log(error.message);
                }
                setSuggestLoading(false);
            } else {
                setSuggestData('');
            }
        };
        getDataFromSearch();
    }, [searchData, userToken]);
    return (
        <div className="main__chatbody">
            <div className="searchSuggest__main">
                <div className="search__Form">
                    <input ref={searchInputRef} onChange={onChangeSuggest} type="text" placeholder="Find by name or key" />
                    <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                </div>
                <div className="suggest__result__contain">
                    {suggestLoading ? (
                        <Loader loader_color="1" />
                    ) : suggestData ? (
                        suggestData.map((data) => {
                            return <SearchItem setSelectUser={setSelectUser} key={data.userID} infoData={data} />;
                        })
                    ) : (
                        <span className="suggest__result__noData">No data</span>
                    )}
                </div>
            </div>
            {selectUser ? <SearchData data={selectUser} /> : ''}
        </div>
    );
}

export default SearchBody;
