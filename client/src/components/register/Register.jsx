import { useState } from 'react';
import { useForm } from '../hook/Form';
import app from '../../configs/firebase';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import './register.css';
import Loader from '../loader/Loader';
import axiosInstance from '../../configs/axiosConfig';

function Login() {
    const [loading, setLoading] = useState(false);
    const [inputError, setInputError] = useState('');
    const [notify, setNotify] = useState('');

    const { formData, onChange } = useForm({
        newName: '',
        email: '',
        password: '',
        repassword: '',
    });

    const checkSamePass = () => {
        if (formData.password !== formData.repassword) {
            setInputError('Passwords do not match !');
            return false;
        } else {
            setInputError('');
            return true;
        }
    };

    const onSubmit = (e) => {
        //setLoading(true);
        e.preventDefault();
        setNotify('');
        if (checkSamePass()) {
            setLoading(true);
            createUserWithEmailAndPassword(getAuth(app), formData.email, formData.password)
                .then(({ user }) => {
                    getAuth(app)
                        .currentUser.getIdToken()
                        .then((IdToken) => {
                            const registerServer = async (IdToken) => {
                                try {
                                    console.log(IdToken);
                                    const { data } = await axiosInstance.post('/api/auth/register', {
                                        idToken: IdToken,
                                        newName: formData.newName,
                                        authType: 'register',
                                    });
                                    console.log(data);
                                    sendEmailVerification(user)
                                        .then(() => {
                                            setNotify('Verification email has been sent !');
                                        })
                                        .catch((error) => {
                                            console.error('Error occurred !' + error.message);
                                        });
                                } catch (error) {
                                    console.error(error);
                                }
                            };
                            registerServer(IdToken);
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                })
                .catch((errors) => {
                    console.log(errors);
                })
                .finally(() => {
                    getAuth(app).signOut();
                    setLoading(false);
                });
        }
    };
    //6
    return (
        <>
            <form className="login__form" onSubmit={onSubmit}>
                <span>Creating a new account</span>
                <input onChange={onChange} type="text" name="newName" required placeholder="Enter your name"></input>
                <input onChange={onChange} type="email" name="email" required placeholder="Enter your email"></input>
                <input
                    onChange={onChange}
                    type="password"
                    pattern=".{6,}"
                    title="Must be as least 6 characters"
                    name="password"
                    required
                    placeholder="Password"
                ></input>
                <input
                    onChange={onChange}
                    type="password"
                    pattern=".{6,}"
                    title="Must be as least 6 characters"
                    name="repassword"
                    required
                    placeholder="Re-enter Password"
                ></input>
                {inputError ? <h3>{inputError}</h3> : ''}
                {notify ? <h3 className="notify">{notify}</h3> : ''}
                <button type="submit">{loading ? <Loader /> : 'Register'}</button>
            </form>
        </>
    );
}

export default Login;
