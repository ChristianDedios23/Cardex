export type RaritySymbolVariant =
    | 'common'
    | 'uncommon'
    | 'promo'
    | 'hyper-rare'
    | 'special-illustration-rare'
    | 'ultra-rare'
    | 'illustration-rare'
    | 'double-rare'
    | 'shiny-rare'
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
