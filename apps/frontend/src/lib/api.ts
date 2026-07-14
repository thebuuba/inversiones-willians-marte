import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from './auth-session.ts';
import {
  BACKEND_AVAILABLE_EVENT,
  BACKEND_UNAVAILABLE_EVENT,
  emitNetworkEvent,
} from './network-status.ts';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const { token } = getStoredAuth();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    emitNetworkEvent(BACKEND_AVAILABLE_EVENT);
    return res;
  },
  (error) => {
    const isLoginRequest = error.config?.url === '/auth/login';
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      clearStoredAuth();
      window.location.href = '/login';
    }
    if (!error.response || error.response.status >= 500) {
      emitNetworkEvent(BACKEND_UNAVAILABLE_EVENT);
    }
    return Promise.reject(error);
  },
);
