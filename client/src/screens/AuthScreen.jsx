import { useState } from 'react';
import Login from '../components/login/Login';
import Register from '../components/register/Register';
import ResetPass from '../components/resetPass/ResetPass';

function AuthScreen() {
    const type = {
        Login: 0,
        Register: 1,
        ResetPass: 2,
    };

    const [authType, setAuthType] = useState(type.Login);
    const resetPassStateChange = () => {
        setAuthType(type.ResetPass);
    };
    return (
        <div className="__main_auth">
            <div className="authtype_block">
                <button onClick={() => setAuthType(type.Login)} className={authType === type.Login ? 'active' : ''}>
                    LOGIN
                </button>
                <button onClick={() => setAuthType(type.Register)} className={authType === type.Register ? 'active' : ''}>
                    REGISTER
                </button>
            </div>
            <img alt="logo" src='https://firebasestorage.googleapis.com/v0/b/chatapp-b90a5.appspot.com/o/systemStorage%2Flogo.png?alt=media&token=cd374444-c18b-4a7b-ab13-8ab57ef2b692'/>
            <div className="auth-frag">
                {authType === type.Login ? <Login stateChangeRP={resetPassStateChange} /> : ''}
                {authType === type.Register ? <Register /> : ''}
                {authType === type.ResetPass ? <ResetPass /> : ''}
            </div>
        </div>
    );
}

export default AuthScreen;
