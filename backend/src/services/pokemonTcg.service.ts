import { escapeLucene } from '../utils/lucene';
import { getCacheTtlMs, getOrFetch, setCached } from './pokemonTcgCache';

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const CARD_DETAIL_SELECT =
    'id,name,number,images,tcgplayer,set,rarity,artist,supertype,subtypes,types,hp,flavorText,attacks,abilities';

export type PokemonCard = {
    id: string;
    name: string;
    number: string | null;
    setSymbol: string | null;
    images?: {
        small?: string;
        large?: string;
    };
    marketPrice: number | null;
};

export type PokemonCardAttack = {
    name: string;
    damage: string | null;
    text: string | null;
};

export type PokemonCardAbility = {
    name: string;
    text: string | null;
};

export type PokemonCardDetail = PokemonCard & {
    setName: string | null;
    setSeries: string | null;
    setLogo: string | null;
    rarity: string | null;
    artist: string | null;
    supertype: string | null;
    subtypes: string[];
    types: string[];
    hp: string | null;
    flavorText: string | null;
    tcgplayerUrl: string | null;
    attacks: PokemonCardAttack[];
    abilities: PokemonCardAbility[];
};

export type PokemonCardSearchResult = {
    data: PokemonCardDetail[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasMore: boolean;
};

export const UPSTREAM_TIMEOUT_MS = 15_000;
export const MIN_QUERY_LENGTH = 3;
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

type TcgPlayerPriceVariant = {
    market?: number;
};

type UpstreamPokemonCard = {
    id: string;
    name: string;
    number?: string;
    images?: {
        small?: string;
        large?: string;
    };
    tcgplayer?: {
        url?: string;
        prices?: Record<string, TcgPlayerPriceVariant>;
    };
    set?: {
        name?: string;
        series?: string;
        images?: {
            symbol?: string;
            logo?: string;
        };
    };
    rarity?: string;
    artist?: string;
    supertype?: string;
    subtypes?: string[];
    types?: string[];
    hp?: string;
    flavorText?: string;
    attacks?: Array<{
        name: string;
        damage?: string;
        text?: string;
    }>;
    abilities?: Array<{
        name: string;
        text?: string;
    }>;
};

const TCGPLAYER_VARIANT_PRIORITY = [
    'normal',
    'holofoil',
    'reverseHolofoil',
    '1stEditionHolofoil',
    '1stEditionNormal',
    'unlimitedHolofoil',
    'unlimited',
];

function extractTcgPlayerMarketPrice(tcgplayer: UpstreamPokemonCard['tcgplayer']): number | null {
    const prices = tcgplayer?.prices;

    if (!prices) {
        return null;
    }

    for (const variant of TCGPLAYER_VARIANT_PRIORITY) {
        const market = prices[variant]?.market;

        if (typeof market === 'number' && Number.isFinite(market)) {
            return market;
        }
    }

    for (const variant of Object.values(prices)) {
        const market = variant?.market;

        if (typeof market === 'number' && Number.isFinite(market)) {
            return market;
        }
    }

    return null;
}

function mapPokemonCard(card: UpstreamPokemonCard): PokemonCard {
    const mapped: PokemonCard = {
        id: card.id,
        name: card.name,
        number: card.number?.trim() ? card.number.trim() : null,
        setSymbol: card.set?.images?.symbol?.trim() ? card.set.images.symbol.trim() : null,
        marketPrice: extractTcgPlayerMarketPrice(card.tcgplayer),
    };

    if (card.images) {
        mapped.images = card.images;
    }

    return mapped;
}

function mapPokemonCardDetail(card: UpstreamPokemonCard): PokemonCardDetail {
    const base = mapPokemonCard(card);

    return {
        ...base,
        setName: card.set?.name?.trim() ? card.set.name.trim() : null,
        setSeries: card.set?.series?.trim() ? card.set.series.trim() : null,
        setLogo: card.set?.images?.logo?.trim() ? card.set.images.logo.trim() : null,
        rarity: card.rarity?.trim() ? card.rarity.trim() : null,
        artist: card.artist?.trim() ? card.artist.trim() : null,
        supertype: card.supertype?.trim() ? card.supertype.trim() : null,
        subtypes: card.subtypes?.filter(Boolean) ?? [],
        types: card.types?.filter(Boolean) ?? [],
        hp: card.hp?.trim() ? card.hp.trim() : null,
        flavorText: card.flavorText?.trim() ? card.flavorText.trim() : null,
        tcgplayerUrl: card.tcgplayer?.url?.trim() ? card.tcgplayer.url.trim() : null,
        attacks:
            card.attacks?.map((attack) => ({
                name: attack.name,
                damage: attack.damage?.trim() ? attack.damage.trim() : null,
                text: attack.text?.trim() ? attack.text.trim() : null,
            })) ?? [],
        abilities:
            card.abilities?.map((ability) => ({
                name: ability.name,
                text: ability.text?.trim() ? ability.text.trim() : null,
            })) ?? [],
    };
}

function seedCardDetailCache(cards: PokemonCardDetail[], ttlMs = getCacheTtlMs()): void {
    for (const card of cards) {
        setCached(`card-detail:${card.id.toLowerCase()}`, card, ttlMs);
    }
}

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
    return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
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

    return getOrFetch(
        cacheKey,
        async () => {
            const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);
            const escaped = escapeLucene(normalized);

            url.searchParams.set('q', `name:${escaped}*`);
            url.searchParams.set('page', String(page));
            url.searchParams.set('pageSize', String(pageSize));
            url.searchParams.set('select', CARD_DETAIL_SELECT);

            const response = await fetchUpstreamWithRetry(url.toString());

            if (!response.ok) {
                throw new PokemonTcgUpstreamError('Failed to search Pokémon cards');
            }

            const body = await response.json();
            const totalCount = body.totalCount ?? 0;
            const currentPage = body.page ?? page;
            const currentPageSize = body.pageSize ?? pageSize;
            const data = (body.data ?? []).map(mapPokemonCardDetail);

            seedCardDetailCache(data);

            return {
                data,
                page: currentPage,
                pageSize: currentPageSize,
                totalCount,
                hasMore: currentPage * currentPageSize < totalCount,
            };
        },
        getCacheTtlMs(),
    );
}

export async function getPokemonCardById(cardId: string): Promise<PokemonCardDetail> {
    const cacheKey = `card-detail:${cardId.toLowerCase()}`;

    return getOrFetch(
        cacheKey,
        async () => {
            const url = new URL(`${POKEMON_TCG_BASE_URL}/cards/${encodeURIComponent(cardId)}`);
            url.searchParams.set('select', CARD_DETAIL_SELECT);

            const response = await fetchUpstreamWithRetry(url.toString());

            if (response.status === 404) {
                throw new PokemonTcgNotFoundError();
            }

            if (!response.ok) {
                throw new PokemonTcgUpstreamError('Failed to fetch Pokémon card');
            }

            const data = await response.json();
            return mapPokemonCardDetail(data.data as UpstreamPokemonCard);
        },
        getCacheTtlMs(),
    );
}
