'use client';

import { useEffect, useRef, useState } from 'react';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const defaultTTL = 30_000;

export function useClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = defaultTTL,
): { data: T | null; loading: boolean; error: string } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    fetcher()
      .then((result) => {
        if (!mounted.current) return;
        cache.set(key, { data: result, expiry: Date.now() + ttl });
        setData(result);
      })
      .catch(() => {
        if (!mounted.current) return;
        setError('Error al cargar datos');
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => { mounted.current = false; };
  }, [key]);

  return { data, loading, error };
}

export function invalidateCache(key: string) {
  cache.delete(key);
}
