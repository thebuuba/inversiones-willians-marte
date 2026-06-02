interface ClientCacheEntry<T> {
  data: T;
  expiry: number;
}

interface ClientCacheResult<T> {
  data: T;
  stale: boolean;
}

const cache = new Map<string, ClientCacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function readClientCache<T>(
  key: string,
  now = Date.now(),
): ClientCacheResult<T> | null {
  const cached = cache.get(key) as ClientCacheEntry<T> | undefined;
  if (!cached) return null;

  return {
    data: cached.data,
    stale: now >= cached.expiry,
  };
}

export function writeClientCache<T>(
  key: string,
  data: T,
  ttl: number,
  now = Date.now(),
) {
  cache.set(key, { data, expiry: now + ttl });
}

export function fetchClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const request = Promise.resolve()
    .then(fetcher)
    .then((result) => {
      if (inflight.get(key) === request) {
        writeClientCache(key, result, ttl);
      }
      return result;
    })
    .finally(() => {
      if (inflight.get(key) === request) {
        inflight.delete(key);
      }
    });

  inflight.set(key, request);
  return request;
}

export function invalidateClientCache(key: string) {
  cache.delete(key);
  inflight.delete(key);
}

export function invalidateClientCachePrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export function clearClientCache() {
  cache.clear();
  inflight.clear();
}
