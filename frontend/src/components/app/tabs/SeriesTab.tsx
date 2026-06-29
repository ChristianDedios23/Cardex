'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IoIosArrowBack } from 'react-icons/io';
import { useApp } from '@/components/app-shell/AppProvider';
import { useUserCards } from '@/contexts/UserCardsContext';
import { useSeriesRouteSync } from '@/hooks/useSeriesRouteSync';
import { Panel } from '@/components/app/shared/Panel';
import { BrandLogoHeader } from '@/components/app/shared/BrandLogoHeader';
import { CardResult } from '@/components/app/cards/CardResult';
import { SetCardsToolbar } from '@/components/app/cards/CardSortButtons';
import { SeriesTile } from '@/components/app/series/SeriesTile';
import { SetTile } from '@/components/app/series/SetTile';
import { SetInfoBar } from '@/components/app/series/SetInfoBar';
import {
    computeSetMarketStats,
    filterSetCards,
    filterSetCardsByOwnership,
    sortSetCards,
    sortSeriesNewestFirst,
} from '@/components/app/card-utils';
import type { CardDetailSelection, SetCardSortDirection, SetCardSortField, SetCardOwnershipFilter } from '@/components/app/types';
import { BULK_OPERATION_COOLDOWN_MS } from '@/components/app/types';
import {
    bulkAddOwnedUserCards,
    bulkRemoveOwnedUserCards,
    createUserCardSnapshot,
    listSeries,
    listSetCards,
    listSetsBySeries,
    type PokemonCard,
    type PokemonCardDetail,
    type PokemonSeries,
    type PokemonSetSummary,
} from '@/lib/api';
import { getAccessToken } from '@/lib/supabase/client';
import {
    buildSeriesEraPath,
    buildSeriesPath,
    buildSetPath,
    parseSeriesPathname,
} from '@/lib/seriesRoutes';

type SeriesTabProps = {
    onViewDetails: (selection: CardDetailSelection) => void;
};

export default function SeriesTab({ onViewDetails }: SeriesTabProps) {
    const { tab, setPageLoading, seriesResetCount } = useApp();
    const pathname = usePathname();
    const router = useRouter();
    const parsedSeriesPath = useMemo(() => parseSeriesPathname(pathname), [pathname]);

    const {
        ownedByExternalId,
        wishlistByExternalId,
        ownedCards,
        handleOwnedChange,
        handleWishlistChange,
        ensureUserCardsLoaded,
        applyBulkOwnedCacheUpdate,
    } = useUserCards();

    const [message, setMessage] = useState<string | null>(null);
    const [seriesLoading, setSeriesLoading] = useState(false);
    const [seriesList, setSeriesList] = useState<PokemonSeries[]>([]);
    const seriesCacheRef = useRef<PokemonSeries[] | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<PokemonSeries | null>(null);
    const [seriesSetsLoading, setSeriesSetsLoading] = useState(false);
    const [seriesSets, setSeriesSets] = useState<PokemonSetSummary[]>([]);
    const seriesSetsCacheRef = useRef(new Map<string, PokemonSetSummary[]>());
    const [selectedSet, setSelectedSet] = useState<PokemonSetSummary | null>(null);
    const [setCardsLoading, setSetCardsLoading] = useState(false);
    const [setCards, setSetCards] = useState<PokemonCardDetail[]>([]);
    const setCardsCacheRef = useRef(new Map<string, PokemonCardDetail[]>());
    const [setCardSearchQuery, setSetCardSearchQuery] = useState('');
    const [setCardOwnershipFilter, setSetCardOwnershipFilter] =
        useState<SetCardOwnershipFilter>('all');
    const [setCardSortField, setSetCardSortField] = useState<SetCardSortField>('number');
    const [setCardSortDirection, setSetCardSortDirection] = useState<SetCardSortDirection>('asc');
    const [setBulkOperating, setSetBulkOperating] = useState<'add' | 'remove' | null>(null);
    const [bulkCooldown, setBulkCooldown] = useState<{
        source: 'add' | 'remove';
        endsAt: number;
    } | null>(null);
    const [, setBulkCooldownTick] = useState(0);

    useSeriesRouteSync({
        tab,
        pathname,
        parsedSeriesPath,
        seriesList,
        seriesSetsLoading,
        setSelectedSeries,
        setSelectedSet,
        setSeriesSets,
        seriesSetsCacheRef,
        setSetCards,
    });

    const setMarketStats = useMemo(() => {
        if (!selectedSet) {
            return null;
        }

        return computeSetMarketStats(setCards, ownedCards);
    }, [selectedSet, setCards, ownedCards]);

    const displayedSetCards = useMemo(() => {
        const byOwnership = filterSetCardsByOwnership(
            setCards,
            setCardOwnershipFilter,
            ownedByExternalId,
        );
        const filtered = filterSetCards(byOwnership, setCardSearchQuery);
        return sortSetCards(filtered, setCardSortField, setCardSortDirection);
    }, [
        setCards,
        setCardSearchQuery,
        setCardOwnershipFilter,
        setCardSortField,
        setCardSortDirection,
        ownedByExternalId,
    ]);

    const bulkCooldownProgress =
        bulkCooldown && bulkCooldown.endsAt > Date.now()
            ? (bulkCooldown.endsAt - Date.now()) / BULK_OPERATION_COOLDOWN_MS
            : 0;
    const isBulkCooldownActive = bulkCooldownProgress > 0;

    const setCardsToAddCount = useMemo(() => {
        return setCards.filter((card) => ownedByExternalId[card.id] == null).length;
    }, [setCards, ownedByExternalId]);

    const setCardsOwnedCount = useMemo(() => {
        return setCards.filter((card) => ownedByExternalId[card.id] != null).length;
    }, [setCards, ownedByExternalId]);

    useEffect(() => {
        if (!bulkCooldown) {
            return;
        }

        if (bulkCooldown.endsAt <= Date.now()) {
            setBulkCooldown(null);
            return;
        }

        const intervalId = window.setInterval(() => {
            if (Date.now() >= bulkCooldown.endsAt) {
                setBulkCooldown(null);
                return;
            }

            setBulkCooldownTick((tick) => tick + 1);
        }, 50);

        return () => window.clearInterval(intervalId);
    }, [bulkCooldown]);

    useEffect(() => {
        setPageLoading(seriesLoading || seriesSetsLoading || setCardsLoading);
        return () => setPageLoading(false);
    }, [seriesLoading, seriesSetsLoading, setCardsLoading, setPageLoading]);

    useEffect(() => {
        if (tab !== 'series') {
            return;
        }

        if (seriesCacheRef.current) {
            setSeriesList(sortSeriesNewestFirst(seriesCacheRef.current));
            return;
        }

        let cancelled = false;

        async function loadSeries() {
            setSeriesLoading(true);

            try {
                const result = await listSeries();

                if (cancelled) {
                    return;
                }

                const sorted = sortSeriesNewestFirst(result.data);
                seriesCacheRef.current = sorted;
                setSeriesList(sorted);
            } catch (error) {
                if (!cancelled) {
                    setMessage(error instanceof Error ? error.message : 'Failed to load series.');
                }
            } finally {
                if (!cancelled) {
                    setSeriesLoading(false);
                }
            }
        }

        void loadSeries();

        return () => {
            cancelled = true;
        };
    }, [tab]);

    useEffect(() => {
        if (tab !== 'series') {
            setSelectedSeries(null);
            setSeriesSets((current) => (current.length > 0 ? [] : current));
            setSelectedSet(null);
            setSetCards((current) => (current.length > 0 ? [] : current));
        }
    }, [tab]);

    useEffect(() => {
        if (seriesResetCount === 0) {
            return;
        }

        setSelectedSeries(null);
        setSeriesSets((current) => (current.length > 0 ? [] : current));
        setSelectedSet(null);
        setSetCards((current) => (current.length > 0 ? [] : current));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [seriesResetCount]);

    useEffect(() => {
        if (tab !== 'series' || !selectedSeries) {
            return;
        }

        const cached = seriesSetsCacheRef.current.get(selectedSeries.name);

        if (cached) {
            setSeriesSets((current) => {
                if (
                    current.length === cached.length &&
                    current.every((set, index) => set.id === cached[index]?.id)
                ) {
                    return current;
                }
                return cached;
            });
            return;
        }

        let cancelled = false;
        const seriesName = selectedSeries.name;

        async function loadSeriesSets() {
            setSeriesSetsLoading(true);

            try {
                const result = await listSetsBySeries(seriesName);

                if (cancelled) {
                    return;
                }

                seriesSetsCacheRef.current.set(seriesName, result.data);
                setSeriesSets(result.data);
            } catch (error) {
                if (!cancelled) {
                    setMessage(error instanceof Error ? error.message : 'Failed to load sets.');
                }
            } finally {
                if (!cancelled) {
                    setSeriesSetsLoading(false);
                }
            }
        }

        void loadSeriesSets();

        return () => {
            cancelled = true;
        };
    }, [selectedSeries, tab]);

    useEffect(() => {
        if (tab !== 'series' || !selectedSet) {
            return;
        }

        ensureUserCardsLoaded();

        const cached = setCardsCacheRef.current.get(selectedSet.id);

        if (cached) {
            setSetCards((current) => {
                if (
                    current.length === cached.length &&
                    current.every((card, index) => card.id === cached[index]?.id)
                ) {
                    return current;
                }
                return cached;
            });
            return;
        }

        let cancelled = false;
        const setId = selectedSet.id;

        async function loadSetCards() {
            setSetCardsLoading(true);

            try {
                const result = await listSetCards(setId);

                if (cancelled) {
                    return;
                }

                setCardsCacheRef.current.set(setId, result.data);
                setSetCards(result.data);
            } catch (error) {
                if (!cancelled) {
                    setMessage(
                        error instanceof Error ? error.message : 'Failed to load set cards.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setSetCardsLoading(false);
                }
            }
        }

        void loadSetCards();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSet, tab]);

    useEffect(() => {
        setSetCardSearchQuery('');
        setSetCardOwnershipFilter('all');
        setSetCardSortField('number');
        setSetCardSortDirection('asc');
        setBulkCooldown(null);
    }, [selectedSet?.id]);

    function startBulkCooldown(source: 'add' | 'remove') {
        setBulkCooldown({
            source,
            endsAt: Date.now() + BULK_OPERATION_COOLDOWN_MS,
        });
    }

    function handleSetCardSortChange(field: SetCardSortField) {
        if (field === setCardSortField) {
            setSetCardSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        } else {
            setSetCardSortField(field);
            setSetCardSortDirection('asc');
        }
    }

    async function handleBulkAddSet() {
        const cardsToAdd = setCards.filter((card) => ownedByExternalId[card.id] == null);

        if (cardsToAdd.length === 0 || !selectedSet) {
            return;
        }

        setSetBulkOperating('add');
        startBulkCooldown('add');
        setMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setMessage('Sign in to save cards.');
                return;
            }

            const result = await bulkAddOwnedUserCards(token, {
                set_id: selectedSet.id,
                cards: cardsToAdd.map((card) => ({
                    external_card_id: card.id,
                    ...createUserCardSnapshot(card),
                })),
            });

            applyBulkOwnedCacheUpdate(result.added);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to add all cards.');
        } finally {
            setSetBulkOperating(null);
        }
    }

    async function handleBulkRemoveSet() {
        const externalCardIds = setCards
            .filter((card) => ownedByExternalId[card.id] != null)
            .map((card) => card.id);

        if (externalCardIds.length === 0) {
            return;
        }

        setSetBulkOperating('remove');
        startBulkCooldown('remove');
        setMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setMessage('Sign in to remove cards.');
                return;
            }

            const result = await bulkRemoveOwnedUserCards(token, {
                external_card_ids: externalCardIds,
            });
            const removedExternalIds = new Set(
                result.removed.map((entry) => entry.external_card_id),
            );

            applyBulkOwnedCacheUpdate([], removedExternalIds);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to remove all cards.');
        } finally {
            setSetBulkOperating(null);
        }
    }

    function handleViewDetails(card: PokemonCard) {
        onViewDetails({
            cardId: card.id,
            preview: card,
            navigationCards: displayedSetCards,
        });
    }

    return (
        <>
            <Panel
                title={!selectedSeries && !selectedSet ? 'Series' : undefined}
                header={
                    selectedSet ? (
                        <BrandLogoHeader
                            logo={selectedSet.logo}
                            alt={selectedSet.name}
                            fallback={selectedSet.name}
                        />
                    ) : selectedSeries ? (
                        <BrandLogoHeader
                            logo={selectedSeries.logo}
                            alt={selectedSeries.name}
                            fallback={selectedSeries.name}
                        />
                    ) : undefined
                }
            >
                {selectedSet && selectedSeries && (
                    <button
                        type="button"
                        onClick={() => router.push(buildSeriesEraPath(selectedSeries.name))}
                        className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        <IoIosArrowBack className="h-4 w-4" aria-hidden="true" />
                        Back to sets
                    </button>
                )}
                {selectedSeries && !selectedSet && (
                    <button
                        type="button"
                        onClick={() => router.push(buildSeriesPath())}
                        className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        <IoIosArrowBack className="h-4 w-4" aria-hidden="true" />
                        Back to all series
                    </button>
                )}

                {!selectedSeries && !selectedSet && seriesLoading && (
                    <p className="text-sm text-[var(--muted)]">Loading series…</p>
                )}
                {!selectedSeries && !selectedSet && !seriesLoading && seriesList.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {seriesList.map((series) => (
                            <SeriesTile
                                key={series.name}
                                series={series}
                                onSelect={() => router.push(buildSeriesEraPath(series.name))}
                            />
                        ))}
                    </div>
                )}
                {!selectedSeries && !selectedSet && !seriesLoading && seriesList.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">No series found.</p>
                )}

                {selectedSeries && !selectedSet && seriesSetsLoading && (
                    <p className="text-sm text-[var(--muted)]">Loading sets…</p>
                )}
                {selectedSeries && !selectedSet && !seriesSetsLoading && seriesSets.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {seriesSets.map((set) => (
                            <SetTile
                                key={set.id}
                                set={set}
                                onSelect={() => {
                                    if (!selectedSeries) {
                                        return;
                                    }

                                    router.push(buildSetPath(selectedSeries.name, set.id));
                                }}
                            />
                        ))}
                    </div>
                )}
                {selectedSeries && !selectedSet && !seriesSetsLoading && seriesSets.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">No sets found.</p>
                )}

                {selectedSet && setCardsLoading && (
                    <p className="text-sm text-[var(--muted)]">Loading cards…</p>
                )}
                {selectedSet && !setCardsLoading && (
                    <>
                        {setMarketStats && (
                            <SetInfoBar
                                set={selectedSet}
                                cards={setCards}
                                stats={setMarketStats}
                                onAddAll={() => void handleBulkAddSet()}
                                onRemoveAll={() => void handleBulkRemoveSet()}
                                bulkOperating={setBulkOperating}
                                bulkCooldownSource={bulkCooldown?.source ?? null}
                                bulkCooldownProgress={bulkCooldownProgress}
                                isBulkCooldownActive={isBulkCooldownActive}
                                addAllRemainingCount={setCardsToAddCount}
                                ownedInSetCount={setCardsOwnedCount}
                            />
                        )}
                        {setCards.length > 0 && (
                            <SetCardsToolbar
                                searchQuery={setCardSearchQuery}
                                onSearchQueryChange={setSetCardSearchQuery}
                                ownershipFilter={setCardOwnershipFilter}
                                onOwnershipFilterChange={setSetCardOwnershipFilter}
                                sortField={setCardSortField}
                                sortDirection={setCardSortDirection}
                                onSortChange={handleSetCardSortChange}
                            />
                        )}
                        {setCards.length > 0 && displayedSetCards.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {displayedSetCards.map((card) => (
                                    <CardResult
                                        key={card.id}
                                        card={card}
                                        ownedUserCardId={ownedByExternalId[card.id] ?? null}
                                        wishlistUserCardId={wishlistByExternalId[card.id] ?? null}
                                        onOwnedChange={handleOwnedChange}
                                        onWishlistChange={handleWishlistChange}
                                        onViewDetails={handleViewDetails}
                                    />
                                ))}
                            </div>
                        ) : setCards.length > 0 ? (
                            <p className="text-sm text-[var(--muted)]">
                                No cards match your filters.
                            </p>
                        ) : (
                            <p className="text-sm text-[var(--muted)]">No cards found.</p>
                        )}
                    </>
                )}
            </Panel>
            {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        </>
    );
}
