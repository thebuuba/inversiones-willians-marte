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
import { api, refreshAccessToken, sessionApi } from './api.ts';
import {
  clearStoredAuth,
  getStoredAuth,
  loadStoredAuthSession,
  saveStoredAuth,
  type StoredAuth,
  type User,
} from './auth-session.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_CHANGED_EVENT = 'auth-changed';

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>({ user: null, token: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function syncAuth() {
      setLoading(true);
      if (!getStoredAuth().token) {
        try {
          const refreshed = await refreshAccessToken();
          if (active) setAuth(refreshed);
        } catch {
          if (active) setAuth({ user: null, token: null });
        } finally {
          if (active) setLoading(false);
        }
        return;
      }
      const nextAuth = await loadStoredAuthSession(async () => {
        const { data } = await api.get('/auth/profile');
        return data.data as User;
      });
      if (!active) return;
      setAuth(nextAuth);
      setLoading(false);
    }

    void syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);

    return () => {
      active = false;
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
    };
  }, []);

  const persistAuth = useCallback((nextAuth: StoredAuth) => {
    saveStoredAuth(nextAuth);
    setAuth(nextAuth);
    setLoading(false);
    notifyAuthChanged();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await sessionApi.post('/login', { username, password });
    const { user, accessToken } = data.data;
    persistAuth({ user, token: accessToken });
  }, [persistAuth]);

  const register = useCallback(async (name: string, username: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, username, password });
    const { user, accessToken } = data.data;
    persistAuth({ user, token: accessToken });
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await sessionApi.post('/logout');
    } catch {
      // Clearing the local session must still work during an outage.
    } finally {
      clearStoredAuth();
      setAuth({ user: null, token: null });
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user: auth.user, token: auth.token, login, register, logout, loading }),
    [auth.token, auth.user, loading, login, register, logout],
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
