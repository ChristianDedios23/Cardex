const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type PokemonCard = {
    id: string;
    name: string;
    images?: {
        small?: string;
        large?: string;
    };
    marketPrice: number | null;
};

export type PaginatedPokemonCardSearch = {
    data: PokemonCard[];
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

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
): Promise<T> {
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

export async function searchCards(query: string, page = 1, pageSize = 20) {
    const params = new URLSearchParams({
        query,
        page: String(page),
        pageSize: String(pageSize),
    });

    return apiFetch<PaginatedPokemonCardSearch>(`/v1/cards/search?${params.toString()}`);
}

export async function getCardById(id: string) {
    return apiFetch<PokemonCard>(`/v1/cards/${encodeURIComponent(id)}`);
}

export async function createUserCard(
    token: string,
    body: {
        external_card_id: string;
        status: 'owned' | 'wishlist';
        quantity?: number;
        condition?: string;
        notes?: string;
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
