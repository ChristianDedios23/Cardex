const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
    data: unknown;
    expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | undefined {
    const entry = cache.get(key);

    if (!entry) {
        return undefined;
    }

    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return undefined;
    }

    return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export async function getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
    const cached = getCached<T>(key);

    if (cached !== undefined) {
        return cached;
    }

    const pending = inFlight.get(key);

    if (pending) {
        return pending as Promise<T>;
    }

    const promise = fetchFn()
        .then((data) => {
            setCached(key, data, ttlMs);
            return data;
        })
        .finally(() => {
            inFlight.delete(key);
        });

    inFlight.set(key, promise);
    return promise;
}
