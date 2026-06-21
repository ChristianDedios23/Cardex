export type RaritySymbolVariant =
    | 'common'
    | 'uncommon'
    | 'promo'
    | 'mega-hyper-rare'
    | 'hyper-rare'
    | 'special-illustration-rare'
    | 'ultra-rare'
    | 'illustration-rare'
    | 'double-rare'
    | 'shiny-rare'
    | 'rainbow-rare'
    | 'secret-rare'
    | 'holo-v-rare'
    | 'holo-gx-rare'
    | 'rare-shiny'
    | 'rare';

/** Maps Pokémon TCG API rarity text to classic rarity symbol shapes. The API has no symbol image field. */
export function resolveRaritySymbol(rarity: string): RaritySymbolVariant | null {
    const normalized = rarity.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    if (normalized.includes('promo')) {
        return 'promo';
    }

    if (normalized.includes('mega hyper rare')) {
        return 'mega-hyper-rare';
    }

    if (normalized.includes('hyper rare')) {
        return 'hyper-rare';
    }

    if (normalized.includes('special illustration')) {
        return 'special-illustration-rare';
    }

    if (normalized.includes('ultra rare')) {
        return 'ultra-rare';
    }

    if (normalized.includes('illustration rare')) {
        return 'illustration-rare';
    }

    if (normalized.includes('double rare')) {
        return 'double-rare';
    }

    if (normalized.includes('shiny rare')) {
        return 'shiny-rare';
    }

    if (normalized.includes('rainbow') && normalized.includes('rare')) {
        return 'rainbow-rare';
    }

    if (normalized.includes('secret') && normalized.includes('rare')) {
        return 'secret-rare';
    }

    if (normalized.includes('holo gx') && normalized.includes('rare')) {
        return 'holo-gx-rare';
    }

    if (normalized.includes('holo v') && normalized.includes('rare')) {
        return 'holo-v-rare';
    }

    if (normalized.includes('rare shiny')) {
        return 'rare-shiny';
    }

    if (normalized.includes('uncommon')) {
        return 'uncommon';
    }

    if (normalized.includes('common')) {
        return 'common';
    }

    if (normalized.includes('rare')) {
        return 'rare';
    }

    return null;
}

/** Scarlet & Violet rarity order (common → rarest). Used for set card sorting. */
const RARITY_VARIANT_SORT_ORDER: Record<RaritySymbolVariant, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    'double-rare': 3,
    'holo-v-rare': 3,
    'holo-gx-rare': 3,
    'rare-shiny': 3,
    'ultra-rare': 4,
    'illustration-rare': 5,
    'special-illustration-rare': 6,
    'rainbow-rare': 7,
    'secret-rare': 7,
    'hyper-rare': 8,
    'mega-hyper-rare': 9,
    'shiny-rare': 10,
    promo: 11,
};

const UNKNOWN_RARITY_SORT_RANK = 1000;

export function getRaritySortRank(rarity: string | null | undefined): number {
    if (!rarity?.trim()) {
        return Number.MAX_SAFE_INTEGER;
    }

    const variant = resolveRaritySymbol(rarity);

    if (variant) {
        return RARITY_VARIANT_SORT_ORDER[variant];
    }

    return UNKNOWN_RARITY_SORT_RANK;
}

export function compareRarities(
    left: string | null | undefined,
    right: string | null | undefined,
    direction: 'asc' | 'desc',
): number {
    const leftRank = getRaritySortRank(left);
    const rightRank = getRaritySortRank(right);

    if (leftRank !== rightRank) {
        const comparison = leftRank - rightRank;
        return direction === 'asc' ? comparison : -comparison;
    }

    const leftLabel = left?.trim() ?? '';
    const rightLabel = right?.trim() ?? '';

    if (!leftLabel && !rightLabel) {
        return 0;
    }

    if (!leftLabel) {
        return 1;
    }

    if (!rightLabel) {
        return -1;
    }

    const tiebreaker = leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
    return direction === 'asc' ? tiebreaker : -tiebreaker;
}
