const DEFAULT_TTL_MS = 30 * 60 * 1000;

export function getCacheTtlMs(): number {
    const raw = process.env.POKEMON_TCG_CACHE_TTL_MS;

    if (!raw) {
        return DEFAULT_TTL_MS;
    }

    const parsed = Number.parseInt(raw, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_TTL_MS;
    }

    return parsed;
}

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

export function setCached<T>(key: string, data: T, ttlMs = getCacheTtlMs()): void {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export async function getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs = getCacheTtlMs(),
): Promise<T> {
    const cached = getCached<T>(key);

    if (cached !== undefined) {
        console.log(`[pokemon-tcg] cache hit: ${key}`);
        return cached;
    }

    console.log(`[pokemon-tcg] upstream fetch: ${key}`);

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
