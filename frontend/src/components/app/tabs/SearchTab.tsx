'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/components/app-shell/AppProvider';
import { Panel } from '@/components/app/shared/Panel';
import { CardResult } from '@/components/app/cards/CardResult';
import { CardSortButtons } from '@/components/app/cards/CardSortButtons';
import { SearchPagination } from '@/components/app/search/SearchPagination';
import {
    canGoToSearchDisplayPage,
    getSearchDisplayTotalPages,
    sortSetCards,
} from '@/components/app/card-utils';
import type { SearchResultCache, SetCardSortDirection, SetCardSortField } from '@/components/app/types';
import type { CardDetailSelection } from '@/components/app/types';
import { useUserCards } from '@/contexts/UserCardsContext';
import {
    SEARCH_DISPLAY_PAGE_SIZE,
    SEARCH_FETCH_PAGE_SIZE,
    SEARCH_MAX_RESULTS,
    searchCards,
    seedCardDetailCache,
    type PokemonCard,
    type PokemonCardDetail,
} from '@/lib/api';

type SearchTabProps = {
    onViewDetails: (selection: CardDetailSelection) => void;
};

export default function SearchTab({ onViewDetails }: SearchTabProps) {
    const { setPageLoading } = useApp();
    const {
        ownedByExternalId,
        wishlistByExternalId,
        handleOwnedChange,
        handleWishlistChange,
        ensureUserCardsLoaded,
    } = useUserCards();

    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchAllResults, setSearchAllResults] = useState<PokemonCardDetail[]>([]);
    const [searchMeta, setSearchMeta] = useState<SearchResultCache['meta'] | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchSortField, setSearchSortField] = useState<SetCardSortField>('name');
    const [searchSortDirection, setSearchSortDirection] = useState<SetCardSortDirection>('asc');
    const [message, setMessage] = useState<string | null>(null);

    const searchCacheRef = useRef(new Map<string, SearchResultCache>());
    const searchInFlightRef = useRef<string | null>(null);

    const sortedSearchResults = useMemo(
        () => sortSetCards(searchAllResults, searchSortField, searchSortDirection),
        [searchAllResults, searchSortField, searchSortDirection],
    );

    const displayedSearchResults = useMemo(() => {
        const start = (currentPage - 1) * SEARCH_DISPLAY_PAGE_SIZE;
        return sortedSearchResults.slice(start, start + SEARCH_DISPLAY_PAGE_SIZE);
    }, [sortedSearchResults, currentPage]);

    useEffect(() => {
        setPageLoading(searchLoading);
        return () => setPageLoading(false);
    }, [searchLoading, setPageLoading]);

    function normalizeQuery(value: string) {
        return value.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function applySearchCache(cache: SearchResultCache) {
        seedCardDetailCache(cache.cards);
        setSearchAllResults(cache.cards);
        setSearchMeta(cache.meta);
        setCurrentPage(1);
    }

    async function fetchAllSearchResults(searchQuery: string) {
        const trimmed = searchQuery.trim();
        const normalized = normalizeQuery(trimmed);
        const cached = searchCacheRef.current.get(normalized);

        if (cached) {
            applySearchCache(cached);
            setMessage(null);
            return;
        }

        if (searchInFlightRef.current === normalized) {
            return;
        }

        searchInFlightRef.current = normalized;
        setSearchLoading(true);
        setMessage(null);

        try {
            const allCards: PokemonCardDetail[] = [];
            let page = 1;
            let totalCount = 0;

            while (allCards.length < SEARCH_MAX_RESULTS) {
                const remaining = SEARCH_MAX_RESULTS - allCards.length;
                const pageSize = Math.min(SEARCH_FETCH_PAGE_SIZE, remaining);
                const result = await searchCards(trimmed, page, pageSize);

                allCards.push(...result.data);
                totalCount = result.totalCount;

                if (!result.hasMore || allCards.length >= totalCount) {
                    break;
                }

                page += 1;
            }

            const cacheEntry: SearchResultCache = {
                cards: allCards,
                meta: {
                    totalCount,
                    fetchedCount: allCards.length,
                    truncated: allCards.length < totalCount,
                },
            };

            searchCacheRef.current.set(normalized, cacheEntry);
            applySearchCache(cacheEntry);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Search failed.');
            setSearchAllResults([]);
            setSearchMeta(null);
        } finally {
            searchInFlightRef.current = null;
            setSearchLoading(false);
        }
    }

    async function handleSearch(event: React.FormEvent) {
        event.preventDefault();

        const trimmed = query.trim();

        if (trimmed.length < 3) {
            setMessage('Search query must be at least 3 characters.');
            return;
        }

        const normalized = normalizeQuery(trimmed);
        const isSameQuery = Boolean(activeQuery && normalizeQuery(activeQuery) === normalized);

        if (isSameQuery) {
            const cached = searchCacheRef.current.get(normalized);

            if (cached) {
                applySearchCache(cached);
                setMessage(null);
                return;
            }
        }

        const previousNormalized = activeQuery ? normalizeQuery(activeQuery) : null;

        if (previousNormalized && previousNormalized !== normalized) {
            searchCacheRef.current.delete(previousNormalized);
        }

        if (!isSameQuery) {
            searchCacheRef.current.delete(normalized);
            setSearchSortField('name');
            setSearchSortDirection('asc');
        }

        setActiveQuery(trimmed);
        ensureUserCardsLoaded();
        await fetchAllSearchResults(trimmed);
    }

    function handleSearchSortChange(field: SetCardSortField) {
        if (field === searchSortField) {
            setSearchSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        } else {
            setSearchSortField(field);
            setSearchSortDirection('asc');
        }
        setCurrentPage(1);
    }

    function goToPage(page: number) {
        if (!activeQuery || searchLoading || searchAllResults.length === 0) {
            return;
        }

        const totalPages = getSearchDisplayTotalPages(sortedSearchResults.length);

        if (!canGoToSearchDisplayPage(page, currentPage, totalPages)) {
            return;
        }

        setCurrentPage(page);
    }

    const searchPanelTitle =
        activeQuery && searchMeta && !searchLoading
            ? `Search Results (${searchMeta.totalCount.toLocaleString()})`
            : 'Search';
    const totalPages =
        searchAllResults.length > 0 ? getSearchDisplayTotalPages(sortedSearchResults.length) : null;
    const hasSearchResults = searchAllResults.length > 0;
    const hasNoSearchResults = Boolean(
        activeQuery && searchMeta && !searchLoading && searchAllResults.length === 0,
    );
    const showSearchPagination = Boolean(
        searchMeta && activeQuery && hasSearchResults && (totalPages ?? 0) > 1,
    );

    function handleViewDetails(card: PokemonCard) {
        onViewDetails({
            cardId: card.id,
            preview: card,
            navigationCards: sortedSearchResults,
        });
    }

    return (
        <>
            <Panel title={searchPanelTitle}>
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name..."
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={searchLoading || query.trim().length < 3}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                        Search
                    </button>
                </form>
                {hasSearchResults && (
                    <div className="mb-4 flex flex-wrap items-stretch gap-2">
                        <CardSortButtons
                            sortField={searchSortField}
                            sortDirection={searchSortDirection}
                            onSortChange={handleSearchSortChange}
                        />
                    </div>
                )}
                {hasSearchResults && searchMeta?.truncated && (
                    <p className="mb-4 text-sm text-[var(--muted)]">
                        Sorting and paging use the first {searchMeta.fetchedCount.toLocaleString()}{' '}
                        of {searchMeta.totalCount.toLocaleString()} results. Try a more specific
                        search to narrow the list.
                    </p>
                )}
                {showSearchPagination && (
                    <div className="mb-4">
                        <SearchPagination
                            currentPage={currentPage}
                            totalPages={totalPages!}
                            hasMore={false}
                            onPageChange={goToPage}
                            disabled={searchLoading}
                            jumpInputId="search-jump-top"
                        />
                    </div>
                )}
                {searchLoading && (
                    <p className="mb-4 text-sm text-[var(--muted)]">
                        Searching… first lookup can take a few seconds.
                    </p>
                )}
                {hasNoSearchResults && (
                    <div className="rounded-lg border border-[var(--border)] p-6 text-center">
                        <p className="text-lg font-semibold">
                            No results with the provided search query.
                        </p>
                    </div>
                )}
                {hasSearchResults && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {displayedSearchResults.map((card) => (
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
                )}
                {showSearchPagination && (
                    <div className="mt-4">
                        <SearchPagination
                            currentPage={currentPage}
                            totalPages={totalPages!}
                            hasMore={false}
                            onPageChange={goToPage}
                            disabled={searchLoading}
                            jumpInputId="search-jump-bottom"
                        />
                    </div>
                )}
            </Panel>
            {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        </>
    );
}
