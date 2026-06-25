import { clearClientCache } from './client-cache.ts';

export interface User {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
}

export interface StoredAuth {
  user: User | null;
  token: string | null;
}

export const AUTH_STORAGE_KEY = 'auth';

export function clearStoredAuth() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  clearClientCache();
}

export function parseStoredAuth(stored: string | null): StoredAuth {
  if (!stored) return { user: null, token: null };

  try {
    const parsed = JSON.parse(stored) as StoredAuth;
    return {
      user: parsed.user ?? null,
      token: parsed.token ?? null,
    };
  } catch {
    clearStoredAuth();
    return { user: null, token: null };
  }
}

export async function loadStoredAuthSession(fetchProfile: () => Promise<User>): Promise<StoredAuth> {
  const stored = parseStoredAuth(localStorage.getItem(AUTH_STORAGE_KEY));
  if (!stored.token) return stored;

  try {
    return { user: await fetchProfile(), token: stored.token };
  } catch {
    clearStoredAuth();
    return { user: null, token: null };
  }
}
