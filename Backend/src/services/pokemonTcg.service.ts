import { escapeLucene } from '../utils/lucene';
import { getCacheTtlMs, getOrFetch } from './pokemonTcgCache';

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const CARD_SELECT = 'id,name,images';
export const UPSTREAM_TIMEOUT_MS = 15_000;
export const MIN_QUERY_LENGTH = 3;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type PokemonCardSearchResult = {
    data: unknown[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasMore: boolean;
};

export class PokemonTcgTimeoutError extends Error {
    constructor() {
        super('Pokémon TCG API timed out');
        this.name = 'PokemonTcgTimeoutError';
    }
}

export class PokemonTcgUpstreamError extends Error {
    constructor(message = 'Failed to reach Pokémon TCG API') {
        super(message);
        this.name = 'PokemonTcgUpstreamError';
    }
}

export class PokemonTcgNotFoundError extends Error {
    constructor(message = 'Card not found') {
        super(message);
        this.name = 'PokemonTcgNotFoundError';
    }
}

function getPokemonTcgHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (process.env.POKEMON_TCG_API_KEY) {
        headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
    }

    return headers;
}

function normalizeSearchQuery(query: string): string {
    return query.trim().toLowerCase();
}

function isTimeoutError(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
    );
}

async function fetchUpstream(url: string): Promise<Response> {
    try {
        return await fetch(url, {
            headers: getPokemonTcgHeaders(),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
    } catch (error) {
        if (isTimeoutError(error)) {
            throw new PokemonTcgTimeoutError();
        }

        throw new PokemonTcgUpstreamError();
    }
}

async function fetchUpstreamWithRetry(url: string): Promise<Response> {
    try {
        return await fetchUpstream(url);
    } catch (error) {
        if (error instanceof PokemonTcgTimeoutError) {
            console.warn('[pokemon-tcg] upstream timed out, retrying once:', url);
            return fetchUpstream(url);
        }

        throw error;
    }
}

export async function searchPokemonCards(
    query: string,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
): Promise<PokemonCardSearchResult> {
    const normalized = normalizeSearchQuery(query);
    const cacheKey = `search:${normalized}:page:${page}:size:${pageSize}`;

    return getOrFetch(cacheKey, async () => {
        const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);
        const escaped = escapeLucene(normalized);

        url.searchParams.set('q', `name:${escaped}*`);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(pageSize));
        url.searchParams.set('select', CARD_SELECT);

        const response = await fetchUpstreamWithRetry(url.toString());

        if (!response.ok) {
            throw new PokemonTcgUpstreamError('Failed to search Pokémon cards');
        }

        const body = await response.json();
        const totalCount = body.totalCount ?? 0;
        const currentPage = body.page ?? page;
        const currentPageSize = body.pageSize ?? pageSize;

        return {
            data: body.data ?? [],
            page: currentPage,
            pageSize: currentPageSize,
            totalCount,
            hasMore: currentPage * currentPageSize < totalCount,
        };
    }, getCacheTtlMs());
}

export async function getPokemonCardById(cardId: string) {
    const cacheKey = `card:${cardId.toLowerCase()}`;

    return getOrFetch(cacheKey, async () => {
        const url = new URL(
            `${POKEMON_TCG_BASE_URL}/cards/${encodeURIComponent(cardId)}`,
        );
        url.searchParams.set('select', CARD_SELECT);

        const response = await fetchUpstreamWithRetry(url.toString());

        if (response.status === 404) {
            throw new PokemonTcgNotFoundError();
        }

        if (!response.ok) {
            throw new PokemonTcgUpstreamError('Failed to fetch Pokémon card');
        }

        const data = await response.json();
        return data.data;
    }, getCacheTtlMs());
}
