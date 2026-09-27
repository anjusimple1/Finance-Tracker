import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../config/authStorage';

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : () => {};
}

/**
 * Syncs Axios default header when token changes at login/logout.
 * Each request still reads the latest token from localStorage in the request interceptor.
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || '').replace(/^\/+/, '');

    const isAuthCall = url.startsWith('auth/login') || url.startsWith('auth/register');

    if (status === 401 && !isAuthCall) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);
