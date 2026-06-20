import { escapeLucene } from '../utils/lucene';
import { getCacheTtlMs, getOrFetch, setCached } from './pokemonTcgCache';

const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';
const CARD_DETAIL_SELECT =
    'id,name,number,images,tcgplayer,set,rarity,artist,supertype,subtypes,types,hp,flavorText,attacks,abilities,evolvesFrom,evolvesTo,weaknesses,resistances,retreatCost';

export type PokemonCardTypeModifier = {
    type: string;
    value: string;
};

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
    cost: string[];
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
    evolvesFrom: string | null;
    evolvesTo: string[];
    weaknesses: PokemonCardTypeModifier[];
    resistances: PokemonCardTypeModifier[];
    retreatCost: string[];
    setReleaseDate: string | null;
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

export type PokemonSeries = {
    name: string;
    logo: string | null;
    releaseDate: string | null;
    setCount: number;
};

export type PokemonSetSummary = {
    id: string;
    name: string;
    series: string;
    releaseDate: string | null;
    logo: string | null;
    symbol: string | null;
    printedTotal: number | null;
    total: number | null;
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
        releaseDate?: string;
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
    evolvesFrom?: string;
    evolvesTo?: string[];
    weaknesses?: Array<{
        type: string;
        value?: string;
    }>;
    resistances?: Array<{
        type: string;
        value?: string;
    }>;
    retreatCost?: string[];
    attacks?: Array<{
        name: string;
        cost?: string[];
        damage?: string;
        text?: string;
    }>;
    abilities?: Array<{
        name: string;
        text?: string;
    }>;
};

type UpstreamPokemonSet = {
    id: string;
    name?: string;
    series?: string;
    releaseDate?: string;
    printedTotal?: number;
    total?: number;
    images?: {
        symbol?: string;
        logo?: string;
    };
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

function mapTypeModifiers(modifiers: UpstreamPokemonCard['weaknesses']): PokemonCardTypeModifier[] {
    return (
        modifiers
            ?.map((modifier) => ({
                type: modifier.type?.trim() ?? '',
                value: modifier.value?.trim() ?? '',
            }))
            .filter((modifier) => modifier.type.length > 0) ?? []
    );
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
        evolvesFrom: card.evolvesFrom?.trim() ? card.evolvesFrom.trim() : null,
        evolvesTo: card.evolvesTo?.filter(Boolean) ?? [],
        weaknesses: mapTypeModifiers(card.weaknesses),
        resistances: mapTypeModifiers(card.resistances),
        retreatCost: card.retreatCost?.filter(Boolean) ?? [],
        setReleaseDate: card.set?.releaseDate?.trim() ? card.set.releaseDate.trim() : null,
        attacks:
            card.attacks?.map((attack) => ({
                name: attack.name,
                cost: attack.cost?.filter(Boolean) ?? [],
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

const SET_LIST_SELECT = 'id,name,series,releaseDate,printedTotal,total,images';
const SET_LIST_PAGE_SIZE = 250;
const SERIES_PINNED_TO_END = new Set(['Other', 'Collections']);

function parseReleaseDate(value: string | null | undefined): number {
    if (!value?.trim()) {
        return 0;
    }

    const [year, month, day] = value.split('/').map((part) => Number.parseInt(part, 10));

    if (!year || !month || !day) {
        return 0;
    }

    return Date.UTC(year, month - 1, day);
}

async function fetchAllUpstreamSets(): Promise<UpstreamPokemonSet[]> {
    const sets: UpstreamPokemonSet[] = [];
    let page = 1;
    let totalCount = Number.POSITIVE_INFINITY;

    while ((page - 1) * SET_LIST_PAGE_SIZE < totalCount) {
        const url = new URL(`${POKEMON_TCG_BASE_URL}/sets`);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(SET_LIST_PAGE_SIZE));
        url.searchParams.set('select', SET_LIST_SELECT);
        url.searchParams.set('orderBy', '-releaseDate');

        const response = await fetchUpstreamWithRetry(url.toString());

        if (!response.ok) {
            throw new PokemonTcgUpstreamError('Failed to fetch Pokémon sets');
        }

        const body = await response.json();
        const pageSets = (body.data ?? []) as UpstreamPokemonSet[];

        sets.push(...pageSets);
        totalCount = body.totalCount ?? sets.length;

        if (pageSets.length === 0) {
            break;
        }

        page += 1;
    }

    return sets;
}

async function getAllPokemonSets(): Promise<UpstreamPokemonSet[]> {
    return getOrFetch('sets:all:v2', () => fetchAllUpstreamSets(), getCacheTtlMs());
}

function mapSetSummary(set: UpstreamPokemonSet): PokemonSetSummary {
    return {
        id: set.id,
        name: set.name?.trim() ? set.name.trim() : set.id,
        series: set.series?.trim() ? set.series.trim() : '',
        releaseDate: set.releaseDate?.trim() ? set.releaseDate.trim() : null,
        logo: set.images?.logo?.trim() ? set.images.logo.trim() : null,
        symbol: set.images?.symbol?.trim() ? set.images.symbol.trim() : null,
        printedTotal: typeof set.printedTotal === 'number' ? set.printedTotal : null,
        total: typeof set.total === 'number' ? set.total : null,
    };
}

function sortSetsForSeriesDisplay(sets: PokemonSetSummary[]): PokemonSetSummary[] {
    const byNewest = [...sets].sort(
        (left, right) => parseReleaseDate(right.releaseDate) - parseReleaseDate(left.releaseDate),
    );
    const result: PokemonSetSummary[] = [];
    const used = new Set<string>();

    function appendWithGalleryVariants(set: PokemonSetSummary) {
        result.push(set);
        used.add(set.id);

        const variants = sets
            .filter(
                (candidate) =>
                    candidate.id !== set.id &&
                    candidate.name.startsWith(`${set.name} `) &&
                    !used.has(candidate.id),
            )
            .sort(
                (left, right) =>
                    parseReleaseDate(left.releaseDate) - parseReleaseDate(right.releaseDate) ||
                    left.name.localeCompare(right.name),
            );

        for (const variant of variants) {
            result.push(variant);
            used.add(variant.id);
        }
    }

    for (const set of byNewest) {
        if (used.has(set.id)) {
            continue;
        }

        const isGalleryVariant = sets.some(
            (candidate) =>
                candidate.id !== set.id &&
                set.name.startsWith(`${candidate.name} `) &&
                candidate.name.length < set.name.length,
        );

        if (isGalleryVariant) {
            continue;
        }

        appendWithGalleryVariants(set);
    }

    for (const set of byNewest) {
        if (!used.has(set.id)) {
            result.push(set);
        }
    }

    return result;
}

function compareCardNumbers(left: string | null, right: string | null): number {
    const leftValue = left?.trim() ?? '';
    const rightValue = right?.trim() ?? '';

    if (/^\d+$/.test(leftValue) && /^\d+$/.test(rightValue)) {
        return Number.parseInt(leftValue, 10) - Number.parseInt(rightValue, 10);
    }

    return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
}

function pickSeriesLogo(sets: UpstreamPokemonSet[], seriesName: string): string | null {
    const flagship = sets.find(
        (set) => set.name?.trim() === seriesName && set.images?.logo?.trim(),
    );

    if (flagship?.images?.logo?.trim()) {
        return flagship.images.logo.trim();
    }

    const sorted = [...sets].sort(
        (left, right) => parseReleaseDate(left.releaseDate) - parseReleaseDate(right.releaseDate),
    );

    for (const set of sorted) {
        if (set.images?.logo?.trim()) {
            return set.images.logo.trim();
        }
    }

    return null;
}

function pickSeriesReleaseDate(sets: UpstreamPokemonSet[], seriesName: string): string | null {
    const flagship = sets.find((set) => set.name?.trim() === seriesName);

    if (flagship?.releaseDate?.trim()) {
        return flagship.releaseDate.trim();
    }

    const sorted = [...sets].sort(
        (left, right) => parseReleaseDate(left.releaseDate) - parseReleaseDate(right.releaseDate),
    );

    return sorted.find((set) => set.releaseDate?.trim())?.releaseDate?.trim() ?? null;
}

export async function listPokemonSeries(): Promise<PokemonSeries[]> {
    return getOrFetch(
        'series:list:v2',
        async () => {
            const sets = await getAllPokemonSets();
            const grouped = new Map<string, UpstreamPokemonSet[]>();

            for (const set of sets) {
                const seriesName = set.series?.trim();

                if (!seriesName) {
                    continue;
                }

                const bucket = grouped.get(seriesName) ?? [];
                bucket.push(set);
                grouped.set(seriesName, bucket);
            }

            const seriesList = [...grouped.entries()].map(([name, seriesSets]) => {
                const isPinned = SERIES_PINNED_TO_END.has(name);
                const releaseDate = isPinned ? null : pickSeriesReleaseDate(seriesSets, name);

                return {
                    name,
                    logo: pickSeriesLogo(seriesSets, name),
                    releaseDate,
                    setCount: seriesSets.length,
                    sortKey: isPinned
                        ? Number.NEGATIVE_INFINITY
                        : parseReleaseDate(releaseDate ?? undefined),
                };
            });

            seriesList.sort((left, right) => {
                if (right.sortKey !== left.sortKey) {
                    return right.sortKey - left.sortKey;
                }

                return left.name.localeCompare(right.name);
            });

            return seriesList.map(({ sortKey: _sortKey, ...series }) => series);
        },
        getCacheTtlMs(),
    );
}

export async function listPokemonSetsBySeries(seriesName: string): Promise<PokemonSetSummary[]> {
    const normalized = seriesName.trim();

    if (!normalized) {
        return [];
    }

    const sets = await getAllPokemonSets();

    return sortSetsForSeriesDisplay(
        sets.filter((set) => set.series?.trim() === normalized).map(mapSetSummary),
    );
}

export async function listPokemonCardsBySet(setId: string): Promise<PokemonCardDetail[]> {
    const normalized = setId.trim().toLowerCase();

    if (!normalized) {
        return [];
    }

    return getOrFetch(
        `set-cards:${normalized}`,
        async () => {
            const cards: PokemonCardDetail[] = [];
            let page = 1;
            let totalCount = Number.POSITIVE_INFINITY;

            while ((page - 1) * SET_LIST_PAGE_SIZE < totalCount) {
                const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);
                url.searchParams.set('q', `set.id:${normalized}`);
                url.searchParams.set('page', String(page));
                url.searchParams.set('pageSize', String(SET_LIST_PAGE_SIZE));
                url.searchParams.set('select', CARD_DETAIL_SELECT);

                const response = await fetchUpstreamWithRetry(url.toString());

                if (!response.ok) {
                    throw new PokemonTcgUpstreamError('Failed to fetch set cards');
                }

                const body = await response.json();
                const pageCards = (body.data ?? []).map(mapPokemonCardDetail);

                cards.push(...pageCards);
                totalCount = body.totalCount ?? cards.length;

                if (pageCards.length === 0) {
                    break;
                }

                page += 1;
            }

            seedCardDetailCache(cards);

            return [...cards].sort((left, right) => compareCardNumbers(left.number, right.number));
        },
        getCacheTtlMs(),
    );
}
