// Shared short-lived cache for the full camp registrations list.
// Only successful, non-empty results are kept, and loads that hang are dropped,
// so a blocked or slow request can never "stick" and show an empty page.
const listCache = new Map<string, { at: number; promise: Promise<any> }>();
const TTL_MS = 30_000;
const LOAD_TIMEOUT_MS = 45_000;

export function getCachedList<T>(key: string, load: () => Promise<T>, fresh = false): Promise<T> {
  const hit = listCache.get(key);
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.promise as Promise<T>;

  const promise = Promise.race([
    load(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Loading registrations timed out')), LOAD_TIMEOUT_MS)
    ),
  ]);
  const entry = { at: Date.now(), promise };
  listCache.set(key, entry);
  promise.then(
    (result: any) => {
      // Don't keep empty lists (e.g. returned before access was granted)
      if (Array.isArray(result) && result.length === 0 && listCache.get(key) === entry) listCache.delete(key);
    },
    () => {
      if (listCache.get(key) === entry) listCache.delete(key);
    }
  );
  return promise;
}

export const clearRegistrationListCache = () => listCache.clear();

const READ_PREFIX = /^(_?fetch|get|has|find|search|list|count|is|calculate|compute|build|format)/;

/** Wraps every write-style method of a service so it clears the cache afterwards. */
export function invalidateCacheOnWrites(service: Record<string, any>) {
  Object.keys(service).forEach((name) => {
    const fn = service[name];
    if (typeof fn !== 'function' || READ_PREFIX.test(name)) return;
    service[name] = function (...args: any[]) {
      const result = fn.apply(service, args);
      if (result && typeof result.then === 'function') {
        return result.finally(clearRegistrationListCache);
      }
      clearRegistrationListCache();
      return result;
    };
  });
}
