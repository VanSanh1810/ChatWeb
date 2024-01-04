import React from 'react';
import './notFound.css';
import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();
    const goBackClick = () => {
        navigate('/main')
    }
    return (
        <div className="not-found">
            <h1>404</h1>
            <h2>NOT FOUND</h2>
            <span>Oops! We can find the page you looking for.</span>
            <button onClick={goBackClick}>Go Back</button>
        </div>
    );
}

export default NotFound;
