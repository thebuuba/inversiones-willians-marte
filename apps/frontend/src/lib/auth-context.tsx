'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { api } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface StoredAuth {
  user: User | null;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'auth';
const AUTH_CHANGED_EVENT = 'auth-changed';

function parseStoredAuth(stored: string | null): StoredAuth {
  if (!stored) return { user: null, token: null };

  try {
    const parsed = JSON.parse(stored) as StoredAuth;
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
    };
  } catch {
    if (typeof window !== 'undefined') localStorage.removeItem(AUTH_STORAGE_KEY);
    return { user: null, token: null };
  }
}

function getAuthSnapshot() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? '';
}

function getServerSnapshot() {
  return '';
}

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_CHANGED_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_CHANGED_EVENT, callback);
  };
}

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerSnapshot);
  const auth = useMemo(() => parseStoredAuth(authSnapshot), [authSnapshot]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, accessToken } = data.data;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token: accessToken }));
    notifyAuthChanged();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyAuthChanged();
  }, []);

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
