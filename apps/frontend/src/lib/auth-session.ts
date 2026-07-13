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
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
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

export function getStoredAuth(): StoredAuth {
  const persistent = typeof localStorage !== 'undefined'
    ? parseStoredAuth(localStorage.getItem(AUTH_STORAGE_KEY))
    : { user: null, token: null };
  if (persistent.token) return persistent;

  const session = typeof sessionStorage !== 'undefined'
    ? parseStoredAuth(sessionStorage.getItem(AUTH_STORAGE_KEY))
    : { user: null, token: null };

  // Migrate sessions created before authentication became permanently persistent.
  if (session.token) saveStoredAuth(session);
  return session;
}

export function saveStoredAuth(auth: StoredAuth) {
  const value = JSON.stringify(auth);
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, value);
  }
}

function isRejectedSession(error: unknown) {
  if (!error || typeof error !== 'object' || !('response' in error)) return false;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 401 || response?.status === 403;
}

export async function loadStoredAuthSession(fetchProfile: () => Promise<User>): Promise<StoredAuth> {
  const stored = getStoredAuth();
  if (!stored.token) return stored;

  try {
    return { user: await fetchProfile(), token: stored.token };
  } catch (error) {
    if (isRejectedSession(error)) {
      clearStoredAuth();
      return { user: null, token: null };
    }

    // Keep the saved session during cold starts, outages, or offline usage.
    return stored;
  }
}
