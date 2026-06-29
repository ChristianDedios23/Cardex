import type {
    PokemonCard,
    PokemonCardDetail,
    PokemonSeries,
    PokemonSetSummary,
    UserCard,
} from '@/lib/api';
import { compareRarities } from '@/lib/pokemonRaritySymbols';
import type {
    SetCardSortDirection,
    SetCardSortField,
    SetCardOwnershipFilter,
    SetMarketStats,
} from '@/components/app/types';
import { SEARCH_DISPLAY_PAGE_SIZE } from '@/lib/api';

export function userCardToPreview(card: UserCard): PokemonCard {
    return {
        id: card.external_card_id,
        name: card.card_name ?? 'Unknown card',
        number: null,
        setSymbol: null,
        marketPrice: card.market_price,
        images: card.card_image_url
            ? { small: card.card_image_url, large: card.card_image_url }
            : undefined,
    };
}

export function formatCardStatus(status: UserCard['status']): string {
    return status === 'owned' ? 'In collection' : 'On wishlist';
}

export function formatCondition(condition: string): string {
    return condition.replace(/_/g, ' ');
}

export function formatTcgPlayerMarketPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

export function formatSetCardCount(set: PokemonSetSummary, loadedCount: number): string {
    const { printedTotal, total } = set;

    if (printedTotal != null && total != null && total > printedTotal) {
        const secretCount = total - printedTotal;
        return `${printedTotal.toLocaleString()} + ${secretCount.toLocaleString()} Secret`;
    }

    if (total != null) {
        return total.toLocaleString();
    }

    return loadedCount.toLocaleString();
}

export function computeSetMarketStats(
    cards: PokemonCardDetail[],
    owned: UserCard[],
): SetMarketStats {
    let fullSetValue = 0;
    let mostExpensiveName: string | null = null;
    let highestPrice = -1;

    for (const card of cards) {
        if (card.marketPrice == null) {
            continue;
        }

        fullSetValue += card.marketPrice;

        if (card.marketPrice > highestPrice) {
            highestPrice = card.marketPrice;
            mostExpensiveName = card.name;
        }
    }

    const cardIds = new Set(cards.map((card) => card.id));
    let yourSetValue = 0;
    let collectedCount = 0;

    for (const entry of owned) {
        if (!cardIds.has(entry.external_card_id)) {
            continue;
        }

        collectedCount += 1;

        if (entry.market_price == null) {
            continue;
        }

        const price =
            typeof entry.market_price === 'number'
                ? entry.market_price
                : Number(entry.market_price);

        if (!Number.isFinite(price)) {
            continue;
        }

        yourSetValue += price * (entry.quantity ?? 1);
    }

    return { fullSetValue, mostExpensiveName, yourSetValue, collectedCount };
}

export function parseCardNumberSortKey(number: string | null): [number, string] {
    if (!number) {
        return [Number.MAX_SAFE_INTEGER, ''];
    }

    const match = number.match(/^(\d+)/);

    if (match) {
        return [Number.parseInt(match[1], 10), number.slice(match[1].length).toLowerCase()];
    }

    return [Number.MAX_SAFE_INTEGER, number.toLowerCase()];
}

export function compareNullableStrings(
    left: string | null,
    right: string | null,
    direction: SetCardSortDirection,
): number {
    if (!left && !right) {
        return 0;
    }

    if (!left) {
        return 1;
    }

    if (!right) {
        return -1;
    }

    const comparison = left.localeCompare(right, undefined, { sensitivity: 'base' });
    return direction === 'asc' ? comparison : -comparison;
}

export function compareNullablePrices(
    left: number | null,
    right: number | null,
    direction: SetCardSortDirection,
): number {
    if (left == null && right == null) {
        return 0;
    }

    if (left == null) {
        return 1;
    }

    if (right == null) {
        return -1;
    }

    const comparison = left - right;
    return direction === 'asc' ? comparison : -comparison;
}

export function compareCardNumbers(
    left: string | null,
    right: string | null,
    direction: SetCardSortDirection,
): number {
    const [leftNumber, leftSuffix] = parseCardNumberSortKey(left);
    const [rightNumber, rightSuffix] = parseCardNumberSortKey(right);

    if (leftNumber !== rightNumber) {
        const comparison = leftNumber - rightNumber;
        return direction === 'asc' ? comparison : -comparison;
    }

    const comparison = leftSuffix.localeCompare(rightSuffix);
    return direction === 'asc' ? comparison : -comparison;
}

export function filterSetCards(cards: PokemonCardDetail[], query: string): PokemonCardDetail[] {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
        return cards;
    }

    return cards.filter((card) => {
        if (card.name.toLowerCase().includes(normalized)) {
            return true;
        }

        return card.number?.toLowerCase().includes(normalized) ?? false;
    });
}

export function filterSetCardsByOwnership(
    cards: PokemonCardDetail[],
    filter: SetCardOwnershipFilter,
    ownedByExternalId: Record<string, string>,
): PokemonCardDetail[] {
    if (filter === 'all') {
        return cards;
    }

    if (filter === 'owned') {
        return cards.filter((card) => ownedByExternalId[card.id] != null);
    }

    return cards.filter((card) => ownedByExternalId[card.id] == null);
}

export function sortSetCards(
    cards: PokemonCardDetail[],
    field: SetCardSortField,
    direction: SetCardSortDirection,
): PokemonCardDetail[] {
    return [...cards].sort((left, right) => {
        switch (field) {
            case 'number':
                return compareCardNumbers(left.number, right.number, direction);
            case 'name':
                return compareNullableStrings(left.name, right.name, direction);
            case 'rarity':
                return compareRarities(left.rarity, right.rarity, direction);
            case 'price':
                return compareNullablePrices(left.marketPrice, right.marketPrice, direction);
            case 'artist':
                return compareNullableStrings(left.artist, right.artist, direction);
            default:
                return 0;
        }
    });
}

export function getCollectionTotal(cards: UserCard[]): number {
    return cards.reduce((total, card) => {
        if (card.market_price == null) {
            return total;
        }

        const price =
            typeof card.market_price === 'number' ? card.market_price : Number(card.market_price);

        if (!Number.isFinite(price)) {
            return total;
        }

        const quantity = card.quantity ?? 1;
        return total + price * quantity;
    }, 0);
}

export function getSearchDisplayTotalPages(resultCount: number): number {
    return Math.max(1, Math.ceil(resultCount / SEARCH_DISPLAY_PAGE_SIZE));
}

export function canGoToSearchDisplayPage(
    page: number,
    currentPage: number,
    totalPages: number,
): boolean {
    return page >= 1 && page <= totalPages && page !== currentPage;
}

export function getFixedPageWindow(current: number, total: number): number[] {
    const windowSize = Math.min(7, total);
    let start = current - 3;
    start = Math.max(1, Math.min(start, total - windowSize + 1));

    return Array.from({ length: windowSize }, (_, index) => start + index);
}

export function parseSeriesReleaseSortKey(releaseDate: string | null): number {
    if (!releaseDate) {
        return 0;
    }

    const [year, month, day] = releaseDate.split('/').map((part) => Number.parseInt(part, 10));

    if (!year || !month || !day) {
        return 0;
    }

    return Date.UTC(year, month - 1, day);
}

const SERIES_PINNED_TO_END = new Set(['Other', 'Collections']);

export function sortSeriesNewestFirst(series: PokemonSeries[]): PokemonSeries[] {
    return [...series].sort((left, right) => {
        const leftPinned = SERIES_PINNED_TO_END.has(left.name);
        const rightPinned = SERIES_PINNED_TO_END.has(right.name);

        if (leftPinned && !rightPinned) {
            return 1;
        }

        if (!leftPinned && rightPinned) {
            return -1;
        }

        const dateDiff =
            parseSeriesReleaseSortKey(right.releaseDate) -
            parseSeriesReleaseSortKey(left.releaseDate);

        if (dateDiff !== 0) {
            return dateDiff;
        }

        return left.name.localeCompare(right.name);
    });
}

export function formatSeriesReleaseDate(releaseDate: string | null): string {
    if (!releaseDate) {
        return 'Various';
    }

    const [year, month, day] = releaseDate.split('/').map((part) => Number.parseInt(part, 10));

    if (!year || !month || !day) {
        return releaseDate;
    }

    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
