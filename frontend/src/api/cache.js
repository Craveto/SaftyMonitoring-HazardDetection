const memoryCache = new Map();
const storageKey = (key) => `sm_cache:${key}`;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getCache = (key, maxAgeMs) => {
  const now = Date.now();
  let entry = memoryCache.get(key);
  if (!entry && typeof window !== "undefined" && window.sessionStorage) {
    const raw = window.sessionStorage.getItem(storageKey(key));
    entry = raw ? safeParse(raw) : null;
  }
  if (!entry) return null;
  if (maxAgeMs && now - entry.ts > maxAgeMs) return null;
  memoryCache.set(key, entry);
  return entry;
};

export const setCache = (key, data) => {
  if (data === null) {
    memoryCache.delete(key);
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(storageKey(key));
    }
    return;
  }
  const entry = { ts: Date.now(), data };
  memoryCache.set(key, entry);
  if (typeof window !== "undefined" && window.sessionStorage) {
    window.sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  }
};
