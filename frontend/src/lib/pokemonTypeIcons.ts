const TYPE_ICON_BASE =
    'https://raw.githubusercontent.com/partywhale/pokemon-type-icons/main/icons';

/** Maps Pokemon TCG API type names to icon filenames. */
const TCG_TYPE_ICON_SLUG: Record<string, string> = {
    Colorless: 'normal',
    Darkness: 'dark',
    Dragon: 'dragon',
    Fairy: 'fairy',
    Fighting: 'fighting',
    Fire: 'fire',
    Grass: 'grass',
    Lightning: 'electric',
    Metal: 'steel',
    Psychic: 'psychic',
    Water: 'water',
};

export function getPokemonTypeIconUrl(type: string): string | null {
    const slug = TCG_TYPE_ICON_SLUG[type] ?? type.trim().toLowerCase();
    if (!slug) {
        return null;
    }

    return `${TYPE_ICON_BASE}/${slug}.svg`;
}
