'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>({ user: null, token: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function syncAuth() {
      setAuth(parseStoredAuth(localStorage.getItem(AUTH_STORAGE_KEY)));
      setLoading(false);
    }

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, accessToken } = data.data;
    const nextAuth = { user, token: accessToken };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    setLoading(false);
    notifyAuthChanged();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ user: null, token: null });
    setLoading(false);
    notifyAuthChanged();
  }, []);

  const value = useMemo(
    () => ({ user: auth.user, token: auth.token, login, logout, loading }),
    [auth.token, auth.user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
