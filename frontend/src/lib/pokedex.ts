import { peekCachedCardDetail } from '@/lib/api';

export type PokedexGeneration = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PokedexSpecies = {
    id: number;
    name: string;
};

export const POKEDEX_GENERATIONS: {
    generation: PokedexGeneration;
    label: string;
    startId: number;
    endId: number;
}[] = [
    { generation: 1, label: 'Gen I', startId: 1, endId: 151 },
    { generation: 2, label: 'Gen II', startId: 152, endId: 251 },
    { generation: 3, label: 'Gen III', startId: 252, endId: 386 },
    { generation: 4, label: 'Gen IV', startId: 387, endId: 493 },
    { generation: 5, label: 'Gen V', startId: 494, endId: 649 },
    { generation: 6, label: 'Gen VI', startId: 650, endId: 721 },
    { generation: 7, label: 'Gen VII', startId: 722, endId: 809 },
    { generation: 8, label: 'Gen VIII', startId: 810, endId: 905 },
    { generation: 9, label: 'Gen IX', startId: 906, endId: 1025 },
];

export const POKEDEX_TOTAL = 1025;

export const POKEDEX_SPRITE_BASE =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Default front sprite — reliable for all 1025 species. */
export function getPokedexSpriteUrl(id: number): string {
    return `${POKEDEX_SPRITE_BASE}/${id}.png`;
}

export function getGenerationForSpeciesId(id: number): PokedexGeneration | null {
    const match = POKEDEX_GENERATIONS.find((entry) => id >= entry.startId && id <= entry.endId);
    return match?.generation ?? null;
}

export function getGenerationLabel(generation: PokedexGeneration): string {
    return POKEDEX_GENERATIONS.find((entry) => entry.generation === generation)?.label ?? '';
}

const GENERATION_ROMAN_NUMERALS: Record<PokedexGeneration, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX',
};

export function getGenerationRomanNumeral(generation: PokedexGeneration): string {
    return GENERATION_ROMAN_NUMERALS[generation];
}

export function formatPokedexNumber(id: number): string {
    return `#${String(id).padStart(4, '0')}`;
}

export function formatSpeciesName(name: string): string {
    return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function filterSpeciesByGeneration(
    species: PokedexSpecies[],
    generation: PokedexGeneration,
): PokedexSpecies[] {
    const range = POKEDEX_GENERATIONS.find((entry) => entry.generation === generation);

    if (!range) {
        return [];
    }

    return species.filter((entry) => entry.id >= range.startId && entry.id <= range.endId);
}

export function normalizePokedexSearchQuery(query: string): string {
    return query.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export function searchPokedexSpecies(species: PokedexSpecies[], query: string): PokedexSpecies[] {
    const normalizedQuery = normalizePokedexSearchQuery(query);

    if (!normalizedQuery) {
        return [];
    }

    const numericQuery = normalizedQuery.replace(/^#/, '');

    return species.filter((entry) => {
        const displayName = formatSpeciesName(entry.name).toLowerCase();
        const rawName = entry.name.replace(/-/g, ' ');
        const dexNumber = String(entry.id);
        const paddedDexNumber = dexNumber.padStart(4, '0');

        if (displayName.includes(normalizedQuery) || rawName.includes(normalizedQuery)) {
            return true;
        }

        if (/^\d+$/.test(numericQuery)) {
            return (
                dexNumber.startsWith(numericQuery) ||
                paddedDexNumber.includes(numericQuery) ||
                dexNumber === numericQuery
            );
        }

        return false;
    });
}

export function normalizePokemonNameForMatch(name: string): string {
    return name
        .toLowerCase()
        .replace(/[.'’]/g, '')
        .replace(/&/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesSpeciesName(normalizedCardName: string, speciesName: string): boolean {
    if (!speciesName) {
        return false;
    }

    if (normalizedCardName === speciesName) {
        return true;
    }

    const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(speciesName)}(?:\\s|$)`);
    return pattern.test(normalizedCardName);
}

export function getSpeciesMatchNames(species: PokedexSpecies): string[] {
    const names = new Set<string>([
        normalizePokemonNameForMatch(formatSpeciesName(species.name)),
        normalizePokemonNameForMatch(species.name),
    ]);

    return [...names].filter(Boolean);
}

export function doesCardNameMatchSpecies(
    cardName: string | null | undefined,
    species: PokedexSpecies,
): boolean {
    if (!cardName) {
        return false;
    }

    const normalizedCardName = normalizePokemonNameForMatch(cardName);

    return getSpeciesMatchNames(species).some((speciesName) =>
        includesSpeciesName(normalizedCardName, speciesName),
    );
}

export function computeOwnedPokedexSpeciesIds(
    ownedCards: Array<{ card_name: string | null; external_card_id: string }>,
    species: PokedexSpecies[],
): Set<number> {
    const pokemonCards = filterOwnedPokemonCardsForPokedex(ownedCards);
    const ownedSpeciesIds = new Set<number>();

    for (const entry of species) {
        const isOwned = pokemonCards.some((card) =>
            doesCardNameMatchSpecies(card.card_name, entry),
        );

        if (isOwned) {
            ownedSpeciesIds.add(entry.id);
        }
    }

    return ownedSpeciesIds;
}

export function isExcludedNonPokemonCardName(cardName: string | null | undefined): boolean {
    if (!cardName) {
        return true;
    }

    const normalized = normalizePokemonNameForMatch(cardName);

    if (normalized.endsWith(' energy')) {
        return true;
    }

    if (normalized.endsWith(' stadium')) {
        return true;
    }

    if (/^basic [a-z]+ energy$/.test(normalized)) {
        return true;
    }

    return false;
}

export function isPokemonSupertype(supertype: string | null | undefined): boolean {
    if (!supertype) {
        return false;
    }

    return supertype.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() === 'pokemon';
}

/** Counts toward Pokédex without fetching card details. Uses name heuristics, plus in-memory cache when available. */
export function isPokemonCardForPokedex(card: {
    card_name: string | null;
    external_card_id: string;
}): boolean {
    if (isExcludedNonPokemonCardName(card.card_name)) {
        return false;
    }

    const cached = peekCachedCardDetail(card.external_card_id);

    if (cached?.supertype) {
        return isPokemonSupertype(cached.supertype);
    }

    return Boolean(card.card_name);
}

export function filterOwnedPokemonCardsForPokedex<
    T extends { card_name: string | null; external_card_id: string },
>(ownedCards: T[]): T[] {
    return ownedCards.filter((card) => isPokemonCardForPokedex(card));
}
