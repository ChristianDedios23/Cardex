const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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

export type PokemonCardTypeModifier = {
    type: string;
    value: string;
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

export type PaginatedPokemonCardSearch = {
    data: PokemonCardDetail[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasMore: boolean;
};

export type UserCard = {
    id: string;
    user_id: string;
    external_card_id: string;
    status: 'owned' | 'wishlist';
    quantity: number | null;
    condition: string | null;
    notes: string | null;
    card_name: string | null;
    card_image_url: string | null;
    market_price: number | null;
    created_at: string;
    updated_at: string;
};

type ApiError = {
    error: string;
};

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
        const message = (data as ApiError).error ?? 'Request failed';
        throw new Error(message);
    }

    return data as T;
}

const cardDetailCache = new Map<string, PokemonCardDetail>();
const cardDetailInflight = new Map<string, Promise<PokemonCardDetail>>();

function cacheCardDetail(detail: PokemonCardDetail): PokemonCardDetail {
    const normalized = normalizeCardDetail(detail);
    cardDetailCache.set(normalized.id.toLowerCase(), normalized);
    return normalized;
}

export function seedCardDetailCache(cards: PokemonCardDetail[]): void {
    for (const card of cards) {
        cacheCardDetail(card);
    }
}

export function peekCachedCardDetail(id: string): PokemonCardDetail | undefined {
    return cardDetailCache.get(id.toLowerCase());
}

export async function searchCards(query: string, page = 1, pageSize = 20) {
    const params = new URLSearchParams({
        query,
        page: String(page),
        pageSize: String(pageSize),
    });

    const result = await apiFetch<PaginatedPokemonCardSearch>(
        `/v1/cards/search?${params.toString()}`,
    );
    seedCardDetailCache(result.data);
    return result;
}

export async function getCardById(id: string) {
    const key = id.toLowerCase();
    const cached = cardDetailCache.get(key);

    if (cached) {
        return cached;
    }

    const inflight = cardDetailInflight.get(key);

    if (inflight) {
        return inflight;
    }

    const promise = apiFetch<PokemonCardDetail>(`/v1/cards/${encodeURIComponent(id)}`)
        .then(cacheCardDetail)
        .finally(() => {
            cardDetailInflight.delete(key);
        });

    cardDetailInflight.set(key, promise);
    return promise;
}

function normalizeCardDetail(raw: PokemonCardDetail): PokemonCardDetail {
    return {
        ...raw,
        subtypes: raw.subtypes ?? [],
        types: raw.types ?? [],
        evolvesTo: raw.evolvesTo ?? [],
        weaknesses: raw.weaknesses ?? [],
        resistances: raw.resistances ?? [],
        retreatCost: raw.retreatCost ?? [],
        attacks: (raw.attacks ?? []).map((attack) => ({
            ...attack,
            cost: attack.cost ?? [],
        })),
        abilities: raw.abilities ?? [],
    };
}

export function createUserCardSnapshot(card: PokemonCard) {
    return {
        card_name: card.name,
        card_image_url: card.images?.large ?? card.images?.small ?? null,
        market_price: card.marketPrice,
    };
}

export async function createUserCard(
    token: string,
    body: {
        external_card_id: string;
        status: 'owned' | 'wishlist';
        quantity?: number;
        condition?: string;
        notes?: string;
        card_name?: string;
        card_image_url?: string | null;
        market_price?: number | null;
    },
) {
    return apiFetch<UserCard>(
        '/v1/user-cards',
        {
            method: 'POST',
            body: JSON.stringify(body),
        },
        token,
    );
}

export async function getMyUserCards(token: string, status?: 'owned' | 'wishlist') {
    const query = status ? `?status=${status}` : '';
    return apiFetch<UserCard[]>(`/v1/user-cards/me${query}`, {}, token);
}

export async function deleteUserCard(token: string, id: string) {
    return apiFetch<void>(
        `/v1/user-cards/${id}`,
        {
            method: 'DELETE',
        },
        token,
    );
}
