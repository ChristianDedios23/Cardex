'use client';

import { useEffect, useMemo, useState } from 'react';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { useApp } from '@/components/app-shell/AppProvider';
import { Panel } from '@/components/app/shared/Panel';
import { CollectionProgressBar } from '@/components/app/series/CollectionProgressBar';
import { PokedexGenTabs } from '@/components/app/pokedex/PokedexGenTabs';
import { PokedexSpeciesCard } from '@/components/app/pokedex/PokedexSpeciesCard';
import { useUserCards } from '@/contexts/UserCardsContext';
import {
    computeOwnedPokedexSpeciesIds,
    filterSpeciesByGeneration,
    getGenerationForSpeciesId,
    normalizePokedexSearchQuery,
    POKEDEX_TOTAL,
    searchPokedexSpecies,
    type PokedexGeneration,
    type PokedexSpecies,
} from '@/lib/pokedex';

export default function PokedexTab() {
    const { setPageLoading } = useApp();
    const { ownedCards, ensureUserCardsLoaded } = useUserCards();
    const [generation, setGeneration] = useState<PokedexGeneration>(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [species, setSpecies] = useState<PokedexSpecies[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const normalizedSearchQuery = useMemo(
        () => normalizePokedexSearchQuery(searchQuery),
        [searchQuery],
    );
    const isSearching = normalizedSearchQuery.length > 0;

    useEffect(() => {
        ensureUserCardsLoaded();
    }, [ensureUserCardsLoaded]);

    useEffect(() => {
        let cancelled = false;

        async function loadSpecies() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/data/pokedex-species.json');

                if (!response.ok) {
                    throw new Error('Failed to load Pokédex data.');
                }

                const payload = (await response.json()) as { species: PokedexSpecies[] };

                if (!cancelled) {
                    setSpecies(payload.species);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load Pokédex data.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadSpecies();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setPageLoading(loading);
        return () => setPageLoading(false);
    }, [loading, setPageLoading]);

    const ownedSpeciesIds = useMemo(
        () => computeOwnedPokedexSpeciesIds(ownedCards, species),
        [ownedCards, species],
    );

    const displayedSpecies = useMemo(() => {
        if (isSearching) {
            return searchPokedexSpecies(species, normalizedSearchQuery);
        }

        return filterSpeciesByGeneration(species, generation);
    }, [species, generation, isSearching, normalizedSearchQuery]);

    return (
        <Panel
            header={
                <div className="mb-4 flex flex-col gap-3">
                    <h2 className="text-lg font-medium">Pokédex</h2>
                    <div className="mx-auto w-full max-w-lg">
                        <CollectionProgressBar
                            collected={ownedSpeciesIds.size}
                            total={POKEDEX_TOTAL}
                            fullWidth
                            unitLabel=""
                            showPercentBelow
                            showCheckpoints={false}
                        />
                    </div>
                    <div className="relative">
                        <PiMagnifyingGlassBold
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search name or number..."
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                        />
                    </div>
                    <PokedexGenTabs value={generation} onChange={setGeneration} />
                </div>
            }
        >
            {loading && <p className="text-sm text-[var(--muted)]">Loading...</p>}
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            {!loading && !error && (
                <>
                    <p className="mb-4 text-sm text-[var(--muted)]">
                        {isSearching
                            ? `${displayedSpecies.length} result${displayedSpecies.length === 1 ? '' : 's'} across all generations`
                            : `${displayedSpecies.length} Pokémon`}
                    </p>
                    {displayedSpecies.length === 0 && isSearching && (
                        <p className="text-sm text-[var(--muted)]">No Pokémon match your search.</p>
                    )}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {displayedSpecies.map((entry) => {
                            const entryGeneration =
                                getGenerationForSpeciesId(entry.id) ?? generation;

                            return (
                                <PokedexSpeciesCard
                                    key={entry.id}
                                    species={entry}
                                    generation={entryGeneration}
                                    owned={ownedSpeciesIds.has(entry.id)}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </Panel>
    );
}
