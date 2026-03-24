import axios from 'axios';

export const http = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 15000
});

http.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const message = error?.response?.data?.error || error.message || 'request_failed';
    return Promise.reject(new Error(message));
  }
);
