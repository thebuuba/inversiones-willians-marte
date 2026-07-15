import axios, { type InternalAxiosRequestConfig } from 'axios';
import {
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
  type StoredAuth,
} from './auth-session.ts';
import {
  BACKEND_AVAILABLE_EVENT,
  BACKEND_UNAVAILABLE_EVENT,
  emitNetworkEvent,
} from './network-status.ts';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 20_000,
});

export const sessionApi = axios.create({
  baseURL: '/api/auth/session',
  timeout: 20_000,
  withCredentials: true,
});

let refreshRequest: Promise<StoredAuth> | null = null;

export function refreshAccessToken(): Promise<StoredAuth> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser session required'));
  if (refreshRequest) return refreshRequest;

  refreshRequest = sessionApi
    .post('/refresh')
    .then(({ data }) => {
      const accessToken = data.data?.accessToken as string | undefined;
      const user = data.data?.user as StoredAuth['user'];
      if (!accessToken || !user) throw new Error('Invalid refresh response');
      const nextAuth = { token: accessToken, user };
      saveStoredAuth(nextAuth);
      return nextAuth;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

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
  async (error) => {
    const isLoginRequest = error.config?.url === '/auth/login';
    const request = error.config as (InternalAxiosRequestConfig & { _sessionRetry?: boolean }) | undefined;
    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      request &&
      !request._sessionRetry &&
      typeof window !== 'undefined'
    ) {
      request._sessionRetry = true;
      try {
        const refreshed = await refreshAccessToken();
        request.headers.Authorization = `Bearer ${refreshed.token}`;
        return api.request(request);
      } catch (refreshError) {
        const refreshStatus = axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;
        if (refreshStatus === 401 || refreshStatus === 403) {
          clearStoredAuth();
          window.location.href = '/login';
        }
      }
    }
    if (!error.response || error.response.status >= 500) {
      emitNetworkEvent(BACKEND_UNAVAILABLE_EVENT);
    }
    return Promise.reject(error);
  },
);
