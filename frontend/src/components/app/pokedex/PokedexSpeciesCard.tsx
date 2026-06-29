'use client';

import {
    formatPokedexNumber,
    formatSpeciesName,
    getGenerationRomanNumeral,
    getPokedexSpriteUrl,
    type PokedexGeneration,
    type PokedexSpecies,
} from '@/lib/pokedex';

export function PokedexSpeciesCard({
    species,
    generation,
    owned = false,
}: {
    species: PokedexSpecies;
    generation: PokedexGeneration;
    owned?: boolean;
}) {
    const displayName = formatSpeciesName(species.name);

    return (
        <article className="grid aspect-square grid-rows-[1fr_auto] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-frame)]">
            <div className="relative flex min-h-0 items-start justify-center px-2 pt-2">
                <p className="absolute right-2.5 top-2 text-xs text-[var(--muted)]">
                    {getGenerationRomanNumeral(generation)}
                </p>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={getPokedexSpriteUrl(species.id)}
                    alt={displayName}
                    loading="lazy"
                    decoding="async"
                    className={`mt-1 h-22 w-22 object-contain transition-opacity [image-rendering:pixelated] ${
                        owned ? 'opacity-100' : 'opacity-25'
                    }`}
                />
            </div>

            <div className="shrink-0 px-2 pb-2.5 pt-1 text-center">
                <p className="truncate text-sm font-semibold leading-tight text-[var(--foreground)]">
                    {displayName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {formatPokedexNumber(species.id)}
                </p>
            </div>
        </article>
    );
}
