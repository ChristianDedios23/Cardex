import { escapeLucene } from '../utils/lucene';
import { getOrFetch } from './pokemonTcgCache';

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const CARD_SELECT = 'id,name,images';
export const UPSTREAM_TIMEOUT_MS = 15_000;
export const MIN_QUERY_LENGTH = 3;

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

export async function searchPokemonCards(query: string) {
    const normalized = normalizeSearchQuery(query);
    const cacheKey = `search:${normalized}`;

    return getOrFetch(cacheKey, async () => {
        const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);
        const escaped = escapeLucene(normalized);

        url.searchParams.set('q', `name:${escaped}*`);
        url.searchParams.set('pageSize', '20');
        url.searchParams.set('select', CARD_SELECT);

        const response = await fetchUpstream(url.toString());

        if (!response.ok) {
            throw new PokemonTcgUpstreamError('Failed to search Pokémon cards');
        }

        const data = await response.json();
        return data.data;
    });
}

export async function getPokemonCardById(cardId: string) {
    const cacheKey = `card:${cardId.toLowerCase()}`;

    return getOrFetch(cacheKey, async () => {
        const url = new URL(
            `${POKEMON_TCG_BASE_URL}/cards/${encodeURIComponent(cardId)}`,
        );
        url.searchParams.set('select', CARD_SELECT);

        const response = await fetchUpstream(url.toString());

        if (response.status === 404) {
            throw new PokemonTcgNotFoundError();
        }

        if (!response.ok) {
            throw new PokemonTcgUpstreamError('Failed to fetch Pokémon card');
        }

        const data = await response.json();
        return data.data;
    });
}
