import React, { useEffect, useState } from 'react';
import './urlScanner.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import axiosInstance from '../../configs/axiosConfig';

function URLScanner(props) {
    const { userToken } = useSelector((state) => state.persistedReducer.authReducer);

    const [scannerData, setScannerData] = useState();
    const [apiStatus, setApiStatus] = useState(200);
    const [isLoading, setIsLoading] = useState(false);
    const { _url } = useSelector((state) => state.persistedReducer.urlScannerReducer);

    useEffect(() => {
        setIsLoading(true);
        const apiURL = `https://www.ipqualityscore.com/api/json/url/1pkRog0yX0tHPJsJnUDhekAYs7Sd6KiA/${encodeURIComponent(_url)}`;
        axiosInstance
            .post('/api/externalResourse/scanUrl', {
                idToken: userToken,
                url: apiURL,
            })
            .then((data) => {
                setApiStatus(data.status);
                setScannerData(data.data);
                // console.log(data.data);
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [_url, userToken]);

    const evaluateRiskScore = (data) => {
        if (data === 100) {
            return 'Dangerous';
        } else if (data >= 85) {
            return 'High risk';
        } else if (data >= 75) {
            return 'Suspicious';
        } else {
            return 'Safe';
        }
    };

    const riskScoreLevel = (data) => {
        if (data) {
            if (data === 100) {
                return 'dangerous';
            } else if (data >= 85) {
                return 'high_risk';
            } else if (data >= 75) {
                return 'suspicious';
            } else {
                return 'safe';
            }
        } else {
            return 'loading';
        }
    };

    const accessLink = () => {
        _url;
        const aDom = document.createElement('a');
        aDom.href = _url;
        aDom.target = '_blank';
        aDom.click();
        aDom.remove();
    };

    return (
        <div className="main_url_scanner">
            <div className="url_scanner_box">
                <div className="url_scanner_box_close">
                    URL Scanner
                    <FontAwesomeIcon icon="fa-solid fa-xmark" onClick={props.onCloseModal} />
                </div>
                <div className="url_scanner_box_content">
                    <p>{_url}</p>
                    <p>You are about to access this link. The following are the evaluation parameters of its safety level</p>
                    <p>
                        General:{' '}
                        <p className={scannerData ? riskScoreLevel(scannerData.risk_score) : null}>{scannerData?.risk_score} </p>
                        <i className={scannerData ? riskScoreLevel(scannerData.risk_score) : null}>
                            {scannerData ? evaluateRiskScore(scannerData.risk_score) : null}
                        </i>
                    </p>
                    <label>
                        More info: <FontAwesomeIcon icon="fa-solid fa-chevron-down" />
                    </label>
                    <div className="url_scanner_content_detail">
                        <pre>{scannerData ? JSON.stringify(scannerData, null, 2) : null}</pre>
                    </div>
                </div>
                <div className="url_scanner_box_action">
                    <button onClick={props.onCloseModal}>Cancel</button>
                    <button onClick={accessLink}>Go</button>
                </div>
            </div>
        </div>
    );
}

export default URLScanner;
