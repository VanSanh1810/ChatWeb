import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
});

axiosInstance.defaults.withCredentials = true;
//axiosInstance.defaults.headers.common['XSRF-Token'] = document.cookie.slice(6);

export default axiosInstance;
