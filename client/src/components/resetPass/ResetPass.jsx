import React, { useState } from 'react';
import { useForm } from '../hook/Form';
import app from '../../configs/firebase';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import Loader from '../loader/Loader';
import './rsp.css';

function ResetPass() {
    const [loading, setLoading] = useState(false);
    const [inputError, setInputError] = useState('');
    const [notify, setNotify] = useState('');

    const { formData, onChange } = useForm({
        email: '',
    });

    const onSubmit = (e) => {
        e.preventDefault();
        setNotify('');
        setLoading(true);
        sendPasswordResetEmail(getAuth(app), formData.email)
            .then(() => {
                setNotify('Email have been sent successfully !');
            })
            .catch((error) => {
                console.log(error);
            })
            .finally(() => {
                setLoading(false);
            });
    };
    return (
        <>
            <form className="login__form" onSubmit={onSubmit}>
                <span>Reset password</span>
                <input type="email" name='email' onChange={onChange} required placeholder="Enter your email"></input>
                {inputError ? <h3>{inputError}</h3> : ''}
                {notify ? <h3 className="notify">{notify}</h3> : ''}
                <button type="submit">{loading ? <Loader /> : 'Send verify email'}</button>
            </form>
        </>
    );
}

export default ResetPass;
