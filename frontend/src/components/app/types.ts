import type { PokemonCard, PokemonCardDetail, UserCard } from '@/lib/api';

export type UserCardPatch =
    | { action: 'add'; card: UserCard }
    | { action: 'remove'; userCardId: string; externalCardId: string };

export type CardDetailSelection = {
    cardId: string;
    preview: PokemonCard | null;
    navigationCards?: PokemonCard[];
};

export type SetMarketStats = {
    fullSetValue: number;
    mostExpensiveName: string | null;
    yourSetValue: number;
    collectedCount: number;
};

export type SetCardSortField = 'number' | 'name' | 'rarity' | 'price' | 'artist';
export type SetCardSortDirection = 'asc' | 'desc';
export type SetCardOwnershipFilter = 'all' | 'owned' | 'need';

export type SearchResultMeta = {
    totalCount: number;
    fetchedCount: number;
    truncated: boolean;
};

export type SearchResultCache = {
    cards: PokemonCardDetail[];
    meta: SearchResultMeta;
};

export const BULK_OPERATION_COOLDOWN_MS = 5_000;
