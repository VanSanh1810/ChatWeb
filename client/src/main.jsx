import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './assets/font.css';
import { Provider } from 'react-redux';
import { store, persistor } from './store/index.js';
import { PersistGate } from 'redux-persist/integration/react';

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <PersistGate persistor={persistor}>
                <App />
        </PersistGate>
    </Provider>,
);
