import React, { useState, useEffect } from 'react';
import { useForm } from '../hook/Form';
import './login.css';
import app from '../../configs/firebase';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import Loader from '../loader/Loader';
import axiosInstance from '../../configs/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { setCredentialData, setUserToken } from '../../store/reducers/authReducer';
import { useDispatch, useSelector } from 'react-redux';

function Login(props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [inputError, setInputError] = useState('');

    const isEmailValid = (email) => {
        // Biểu thức chính quy để kiểm tra định dạng email
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleClick = () => {
        // Gọi hàm từ props để cập nhật state của cha
        props.stateChangeRP();
    };

    const { formData, onChange } = useForm({
        email: '',
        password: '',
    });
    const onSubmit = (e) => {
        e.preventDefault();
        if (isEmailValid(formData.email)) {
            setLoading(true);
            setInputError('');
            signInWithEmailAndPassword(getAuth(app), formData.email, formData.password)
                .then((userCredentail) => {
                    getAuth(app)
                        .currentUser.getIdToken(/* forceRefresh */ true)
                        .then((IdToken) => {
                            const loginServer = async () => {
                                try {
                                    const { data } = await axiosInstance.post(
                                        '/api/auth/login',
                                        { idToken: IdToken },
                                        {
                                            withCredentials: true,
                                        },
                                    );
                                    dispatch(setUserToken(IdToken.toString()));
                                    navigate('/main');
                                } catch (error) {
                                    console.error(error);
                                    setInputError(error.message);
                                    getAuth(app).signOut();
                                }
                            };
                            loginServer();
                        })
                        .catch(function (error) {
                            console.error(error);
                            getAuth(app).signOut();
                        });
                })
                .catch((errors) => {
                    console.log(errors);
                    if (errors.code === 'auth/invalid-login-credentials') {
                        setInputError('Username or password are not correct');
                    }
                    getAuth(app).signOut();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setInputError('Your email is invalid');
        }
    };
    return (
        <>
            <form className="login__form" onSubmit={onSubmit}>
                <span>Sign into your account</span>
                <input type="email" onChange={onChange} name="email" required placeholder="Enter your email"></input>
                <input type="password" onChange={onChange} name="password" required placeholder="Password"></input>
                {inputError ? <h3>{inputError}</h3> : ''}
                <button type="submit">{loading ? <Loader /> : 'Login'}</button>
            </form>
            <a onClick={handleClick} className="fg-link">
                Forgot password?
            </a>
        </>
    );
}

export default Login;
