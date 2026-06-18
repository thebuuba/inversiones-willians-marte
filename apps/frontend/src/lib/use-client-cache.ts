'use client';

import { useEffect, useState } from 'react';
import {
  fetchClientCache,
  invalidateClientCache,
  invalidateClientCachePrefix,
  readClientCache,
} from './client-cache';
import { emitNetworkEvent, STALE_DATA_EVENT } from './network-status';

const defaultTTL = 30_000;

interface ClientCacheState<T> {
  key: string;
  data: T | null;
  loading: boolean;
  error: string;
}

export function useClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = defaultTTL,
  errorMessage = 'Error al cargar datos',
): { data: T | null; loading: boolean; error: string } {
  const [state, setState] = useState<ClientCacheState<T>>(() => {
    const cached = readClientCache<T>(key);
    return {
      key,
      data: cached?.data ?? null,
      loading: !cached,
      error: '',
    };
  });

  useEffect(() => {
    let cancelled = false;
    const cached = readClientCache<T>(key);

    if (cached && !cached.stale) {
      return;
    }

    fetchClientCache(key, fetcher, ttl)
      .then((result) => {
        if (cancelled) return;
        setState({ key, data: result, loading: false, error: '' });
      })
      .catch(() => {
        if (cancelled) return;
        if (cached) emitNetworkEvent(STALE_DATA_EVENT);
        setState({
          key,
          data: cached?.data ?? null,
          loading: false,
          error: errorMessage,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [errorMessage, fetcher, key, ttl]);

  if (state.key === key) {
    return state;
  }

  const cached = readClientCache<T>(key);
  return {
    data: cached?.data ?? null,
    loading: !cached,
    error: '',
  };
}

export function invalidateCache(key: string) {
  invalidateClientCache(key);
}

export function invalidateCachePrefix(prefix: string) {
  invalidateClientCachePrefix(prefix);
}
