'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import { useApp, type AppTab } from '@/components/app-shell/AppProvider';
import { AboutPage } from '@/components/AboutPage';
import { ChangelogPage } from '@/components/ChangelogPage';
import { ContactPage } from '@/components/ContactPage';
import { CardDetailModal } from '@/components/CardDetailModal';
import { getAccessToken } from '@/lib/supabase/client';
import {
    bulkAddOwnedUserCards,
    bulkRemoveOwnedUserCards,
    createUserCard,
    createUserCardSnapshot,
    deleteUserCard,
    getMyUserCards,
    listSeries,
    listSetCards,
    listSetsBySeries,
    SEARCH_DISPLAY_PAGE_SIZE,
    SEARCH_FETCH_PAGE_SIZE,
    SEARCH_MAX_RESULTS,
    searchCards,
    seedCardDetailCache,
    type PokemonCard,
    type PokemonCardDetail,
    type PokemonSeries,
    type PokemonSetSummary,
    type UserCard,
} from '@/lib/api';
import { compareRarities } from '@/lib/pokemonRaritySymbols';

type UserCardPatch =
    | { action: 'add'; card: UserCard }
    | { action: 'remove'; userCardId: string; externalCardId: string };

type CardDetailSelection = {
    cardId: string;
    preview: PokemonCard | null;
    navigationCards?: PokemonCard[];
};

function userCardToPreview(card: UserCard): PokemonCard {
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

function Panel({
    title,
    header,
    children,
}: {
    title?: string;
    header?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            {header ?? (title ? <h2 className="mb-4 text-lg font-medium">{title}</h2> : null)}
            {children}
        </section>
    );
}

function BrandLogoHeader({
    logo,
    alt,
    fallback,
}: {
    logo: string | null;
    alt: string;
    fallback: string;
}) {
    return (
        <div className="mx-auto mb-4 flex h-20 w-full max-w-[15rem] items-center justify-center">
            {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={logo}
                    alt={alt}
                    className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                />
            ) : (
                <h2 className="text-center text-lg font-medium">{fallback}</h2>
            )}
        </div>
    );
}

function HomePage() {
    return (
        <section className="mx-auto flex max-w-3xl flex-col gap-6 py-8 text-center md:py-16">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                    Welcome to Cardex
                </h1>
                <p className="mt-3 text-base text-[var(--muted)] md:text-lg">
                    Your Pokémon card collection, organized in one place.
                </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-left">
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                    This is a placeholder home page. Soon you&apos;ll see featured sets, collection
                    highlights, and quick links to search and browse your cards. Sign in from the
                    top right to start building your collection.
                </p>
            </div>
        </section>
    );
}

function PlusIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M5 13l4 4L19 7" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

function StarIcon({ filled = false }: { filled?: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={filled ? '0' : '2'}
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
    );
}

function CardResult({
    card,
    ownedUserCardId,
    wishlistUserCardId,
    onOwnedChange,
    onWishlistChange,
    onViewDetails,
}: {
    card: PokemonCard;
    ownedUserCardId: string | null;
    wishlistUserCardId: string | null;
    onOwnedChange: (patch: UserCardPatch) => void;
    onWishlistChange: (patch: UserCardPatch) => void;
    onViewDetails: (card: PokemonCard) => void;
}) {
    const [savingAction, setSavingAction] = useState<'owned' | 'wishlist' | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const imageUrl = card.images?.small ?? card.images?.large;
    const isSavingOwned = savingAction === 'owned';
    const isSavingWishlist = savingAction === 'wishlist';
    const isOwned = ownedUserCardId !== null;
    const isWishlisted = wishlistUserCardId !== null;

    async function toggleOwned() {
        setSavingAction('owned');
        setErrorMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setErrorMessage('Sign in to save cards.');
                return;
            }

            if (ownedUserCardId) {
                await deleteUserCard(token, ownedUserCardId);
                onOwnedChange({
                    action: 'remove',
                    userCardId: ownedUserCardId,
                    externalCardId: card.id,
                });
            } else {
                const saved = await createUserCard(token, {
                    external_card_id: card.id,
                    status: 'owned',
                    quantity: 1,
                    ...createUserCardSnapshot(card),
                });
                onOwnedChange({ action: 'add', card: saved });
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Failed to update collection.',
            );
        } finally {
            setSavingAction(null);
        }
    }

    async function toggleWishlist() {
        setSavingAction('wishlist');
        setErrorMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setErrorMessage('Sign in to save cards.');
                return;
            }

            if (wishlistUserCardId) {
                await deleteUserCard(token, wishlistUserCardId);
                onWishlistChange({
                    action: 'remove',
                    userCardId: wishlistUserCardId,
                    externalCardId: card.id,
                });
            } else {
                const saved = await createUserCard(token, {
                    external_card_id: card.id,
                    status: 'wishlist',
                    ...createUserCardSnapshot(card),
                });
                onWishlistChange({ action: 'add', card: saved });
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update wishlist.');
        } finally {
            setSavingAction(null);
        }
    }

    return (
        <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card-frame)]">
            <div className="card-tile-art flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-lg bg-[var(--background)] p-2">
                {imageUrl ? (
                    <button
                        type="button"
                        onClick={() => onViewDetails(card)}
                        aria-label={`View details for ${card.name}`}
                        className="card-tile-shine block max-h-full max-w-full border-0 bg-transparent p-0"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={card.name}
                            className="block max-h-full max-w-full object-contain"
                        />
                    </button>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
                        No image
                    </div>
                )}
            </div>

            <p className="truncate px-2 pt-2 text-center text-sm font-medium" title={card.name}>
                {card.name}
            </p>

            {(card.setSymbol || card.number) && (
                <p className="flex items-center justify-center gap-1 px-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                    {card.setSymbol && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={card.setSymbol}
                            alt=""
                            className="h-4 w-auto max-w-[1.25rem] shrink-0 object-contain"
                            aria-hidden="true"
                        />
                    )}
                    {card.number && (
                        <span>{card.setSymbol ? ` · #${card.number}` : `#${card.number}`}</span>
                    )}
                </p>
            )}

            {card.marketPrice != null ? (
                <p className="truncate px-2 pb-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                    Market Price · {formatTcgPlayerMarketPrice(card.marketPrice)}
                </p>
            ) : (
                <p className="px-2 pb-2 text-center text-xs text-[var(--muted)]">
                    Price unavailable
                </p>
            )}

            <div className="mt-auto shrink-0 border-t border-[var(--border)]">
                <div className="grid min-h-12 grid-cols-2">
                    <button
                        type="button"
                        disabled={isSavingOwned}
                        onClick={toggleOwned}
                        title={isOwned ? 'Remove from collection' : 'Add to collection'}
                        aria-label={
                            isOwned
                                ? `Remove ${card.name} from collection`
                                : `Add ${card.name} to collection`
                        }
                        className={`group flex h-full min-h-12 w-full items-center justify-center transition-colors ${
                            isOwned
                                ? 'text-[var(--success)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]'
                                : 'text-[var(--success)] hover:bg-[var(--success)]/10'
                        } ${isSavingOwned ? 'opacity-50' : ''}`}
                    >
                        {isSavingOwned ? (
                            <span className="text-xs text-[var(--muted)]">…</span>
                        ) : isOwned ? (
                            <>
                                <span className="group-hover:hidden">
                                    <CheckIcon />
                                </span>
                                <span className="hidden group-hover:block">
                                    <XIcon />
                                </span>
                            </>
                        ) : (
                            <PlusIcon />
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={isSavingWishlist}
                        onClick={toggleWishlist}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-label={
                            isWishlisted
                                ? `Remove ${card.name} from wishlist`
                                : `Add ${card.name} to wishlist`
                        }
                        className={`flex h-full min-h-12 w-full items-center justify-center border-l border-[var(--border)] text-[var(--star)] transition-colors hover:bg-[var(--star)]/10 ${
                            isSavingWishlist ? 'opacity-50' : ''
                        }`}
                    >
                        {savingAction === 'wishlist' ? (
                            <span className="text-xs text-[var(--muted)]">…</span>
                        ) : (
                            <StarIcon filled={isWishlisted} />
                        )}
                    </button>
                </div>

                {errorMessage && (
                    <p className="border-t border-[var(--border)] px-2 py-1.5 text-center text-[10px] leading-tight text-[var(--danger)]">
                        {errorMessage}
                    </p>
                )}
            </div>
        </article>
    );
}

function formatCardStatus(status: UserCard['status']): string {
    return status === 'owned' ? 'In collection' : 'On wishlist';
}

function formatCondition(condition: string): string {
    return condition.replace(/_/g, ' ');
}

function formatTcgPlayerMarketPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

function formatSetCardCount(set: PokemonSetSummary, loadedCount: number): string {
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

type SetMarketStats = {
    fullSetValue: number;
    mostExpensiveName: string | null;
    yourSetValue: number;
    collectedCount: number;
};

function computeSetMarketStats(cards: PokemonCardDetail[], owned: UserCard[]): SetMarketStats {
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

type SetCardSortField = 'number' | 'name' | 'rarity' | 'price' | 'artist';
type SetCardSortDirection = 'asc' | 'desc';
type SetCardOwnershipFilter = 'all' | 'owned' | 'need';

const SET_CARD_SORT_OPTIONS: { field: SetCardSortField; label: string }[] = [
    { field: 'number', label: 'Number' },
    { field: 'name', label: 'Name' },
    { field: 'rarity', label: 'Rarity' },
    { field: 'price', label: 'Price' },
    { field: 'artist', label: 'Artist' },
];

const BULK_OPERATION_COOLDOWN_MS = 5_000;

function parseCardNumberSortKey(number: string | null): [number, string] {
    if (!number) {
        return [Number.MAX_SAFE_INTEGER, ''];
    }

    const match = number.match(/^(\d+)/);

    if (match) {
        return [Number.parseInt(match[1], 10), number.slice(match[1].length).toLowerCase()];
    }

    return [Number.MAX_SAFE_INTEGER, number.toLowerCase()];
}

function compareNullableStrings(
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

function compareNullablePrices(
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

function compareCardNumbers(
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

function filterSetCards(cards: PokemonCardDetail[], query: string): PokemonCardDetail[] {
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

function filterSetCardsByOwnership(
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

function sortSetCards(
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

function SetCardSortButton({
    label,
    active,
    direction,
    onClick,
}: {
    label: string;
    active: boolean;
    direction: SetCardSortDirection | null;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                active
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
        >
            {label}
            <span className="flex flex-col leading-none" aria-hidden="true">
                <IoChevronUp
                    className={`h-2.5 w-2.5 ${active && direction === 'asc' ? 'opacity-100' : 'opacity-30'}`}
                />
                <IoChevronDown
                    className={`-mt-0.5 h-2.5 w-2.5 ${active && direction === 'desc' ? 'opacity-100' : 'opacity-30'}`}
                />
            </span>
        </button>
    );
}

function CardSortButtons({
    sortField,
    sortDirection,
    onSortChange,
}: {
    sortField: SetCardSortField;
    sortDirection: SetCardSortDirection;
    onSortChange: (field: SetCardSortField) => void;
}) {
    return (
        <>
            {SET_CARD_SORT_OPTIONS.map(({ field, label }) => (
                <SetCardSortButton
                    key={field}
                    label={label}
                    active={sortField === field}
                    direction={sortField === field ? sortDirection : null}
                    onClick={() => onSortChange(field)}
                />
            ))}
        </>
    );
}

function SetCardOwnershipTabs({
    value,
    onChange,
}: {
    value: SetCardOwnershipFilter;
    onChange: (value: SetCardOwnershipFilter) => void;
}) {
    const ownershipOptions: { value: SetCardOwnershipFilter; label: string }[] = [
        { value: 'all', label: 'Show All' },
        { value: 'owned', label: 'Owned' },
        { value: 'need', label: 'Need' },
    ];
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Partial<Record<SetCardOwnershipFilter, HTMLButtonElement>>>({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        function updateIndicator() {
            const activeTab = tabRefs.current[value];

            if (!activeTab) {
                return;
            }

            setIndicator({
                left: activeTab.offsetLeft,
                width: activeTab.offsetWidth,
            });
        }

        updateIndicator();

        const resizeObserver = new ResizeObserver(updateIndicator);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [value]);

    return (
        <div ref={containerRef} className="relative mt-3 border-b border-[var(--border)]">
            <div className="flex gap-6">
                {ownershipOptions.map(({ value: optionValue, label }) => {
                    const active = value === optionValue;

                    return (
                        <button
                            key={optionValue}
                            ref={(element) => {
                                if (element) {
                                    tabRefs.current[optionValue] = element;
                                }
                            }}
                            type="button"
                            onClick={() => onChange(optionValue)}
                            className={`pb-2 text-sm font-medium transition-colors ${
                                active
                                    ? 'text-white'
                                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
            <div
                aria-hidden="true"
                className="absolute bottom-0 h-0.5 bg-[var(--accent)] transition-[transform,width] duration-300 ease-out"
                style={{
                    width: indicator.width,
                    transform: `translateX(${indicator.left}px)`,
                }}
            />
        </div>
    );
}

function SetCardsToolbar({
    searchQuery,
    onSearchQueryChange,
    ownershipFilter,
    onOwnershipFilterChange,
    sortField,
    sortDirection,
    onSortChange,
}: {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    ownershipFilter: SetCardOwnershipFilter;
    onOwnershipFilterChange: (value: SetCardOwnershipFilter) => void;
    sortField: SetCardSortField;
    sortDirection: SetCardSortDirection;
    onSortChange: (field: SetCardSortField) => void;
}) {
    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-stretch gap-2">
                <div className="relative min-w-[12rem] flex-1">
                    <PiMagnifyingGlassBold
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder="Name or Number..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]"
                    />
                </div>
                <CardSortButtons
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={onSortChange}
                />
            </div>
            <SetCardOwnershipTabs value={ownershipFilter} onChange={onOwnershipFilterChange} />
        </div>
    );
}

function getCollectionTotal(cards: UserCard[]): number {
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

function UserCardRow({
    card,
    onDeleted,
    onViewDetails,
}: {
    card: UserCard;
    onDeleted: (patch: UserCardPatch) => void;
    onViewDetails: (card: UserCard) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setError('You are not signed in.');
                return;
            }

            await deleteUserCard(token, card.id);
            onDeleted({
                action: 'remove',
                userCardId: card.id,
                externalCardId: card.external_card_id,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete card.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] p-3">
            {card.card_image_url ? (
                <button
                    type="button"
                    onClick={() => onViewDetails(card)}
                    aria-label={`View details for ${card.card_name ?? 'card'}`}
                    className="shrink-0 rounded border-0 bg-transparent p-0"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={card.card_image_url}
                        alt={card.card_name ?? 'Card'}
                        className="h-20 w-auto rounded object-contain transition-opacity hover:opacity-90"
                    />
                </button>
            ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded bg-white/5 text-xs text-[var(--muted)]">
                    No image
                </div>
            )}
            <div className="flex-1">
                <p className="font-medium">{card.card_name ?? 'Unknown card'}</p>
                {card.market_price != null && (
                    <p className="text-sm text-[var(--muted)]">
                        Market Price · {formatTcgPlayerMarketPrice(card.market_price)}
                    </p>
                )}
                <p className="text-sm text-[var(--muted)]">
                    {formatCardStatus(card.status)}
                    {card.quantity != null
                        ? ` · ${card.quantity} copy${card.quantity === 1 ? '' : 'ies'}`
                        : ''}
                    {card.condition ? ` · ${formatCondition(card.condition)}` : ''}
                </p>
                {card.notes && <p className="mt-1 text-sm text-[var(--muted)]">{card.notes}</p>}
                {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
            </div>
            <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="rounded-md border border-[var(--danger)] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-red-500/10 disabled:opacity-50"
            >
                Remove
            </button>
        </div>
    );
}

type SearchResultMeta = {
    totalCount: number;
    fetchedCount: number;
    truncated: boolean;
};

type SearchResultCache = {
    cards: PokemonCardDetail[];
    meta: SearchResultMeta;
};

function getSearchDisplayTotalPages(resultCount: number): number {
    return Math.max(1, Math.ceil(resultCount / SEARCH_DISPLAY_PAGE_SIZE));
}

function canGoToSearchDisplayPage(page: number, currentPage: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages && page !== currentPage;
}

function getFixedPageWindow(current: number, total: number): number[] {
    const windowSize = Math.min(7, total);
    let start = current - 3;
    start = Math.max(1, Math.min(start, total - windowSize + 1));

    return Array.from({ length: windowSize }, (_, index) => start + index);
}

function SearchPagination({
    currentPage,
    totalPages,
    hasMore,
    onPageChange,
    disabled = false,
    jumpInputId = 'jump-to-page',
}: {
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    jumpInputId?: string;
}) {
    const [jumpValue, setJumpValue] = useState(String(currentPage));

    useEffect(() => {
        setJumpValue(String(currentPage));
    }, [currentPage]);

    const pageItems = getFixedPageWindow(currentPage, totalPages);
    const pageButtonClass =
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm tabular-nums';
    const canGoNext = currentPage < totalPages || hasMore;

    function handleJump(event: FormEvent) {
        event.preventDefault();

        const parsed = Number.parseInt(jumpValue, 10);

        if (!Number.isFinite(parsed) || parsed < 1) {
            return;
        }

        onPageChange(parsed);
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <nav
                aria-label="Search results pagination"
                className="flex items-center justify-center gap-1"
            >
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={disabled || currentPage <= 1}
                    aria-label="Previous page"
                    className={`${pageButtonClass} border border-[var(--border)] hover:bg-white/5 disabled:opacity-50`}
                >
                    <IoIosArrowBack className="h-5 w-5" aria-hidden="true" />
                </button>

                {pageItems.map((page) => (
                    <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        disabled={disabled || page === currentPage}
                        aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`${pageButtonClass} ${
                            page === currentPage
                                ? 'bg-[var(--accent)] font-medium text-white'
                                : 'border border-[var(--border)] hover:bg-white/5'
                        } disabled:opacity-100`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={disabled || !canGoNext}
                    aria-label="Next page"
                    className={`${pageButtonClass} border border-[var(--border)] hover:bg-white/5 disabled:opacity-50`}
                >
                    <IoIosArrowForward className="h-5 w-5" aria-hidden="true" />
                </button>
            </nav>

            <form
                onSubmit={handleJump}
                className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--muted)]"
            >
                <label htmlFor={jumpInputId}>Go to page</label>
                <input
                    id={jumpInputId}
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpValue}
                    onChange={(event) => setJumpValue(event.target.value)}
                    disabled={disabled}
                    className="w-16 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-center text-[var(--foreground)] disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled || !jumpValue.trim()}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 hover:bg-white/5 disabled:opacity-50"
                >
                    Go
                </button>
            </form>
        </div>
    );
}

function parseSeriesReleaseSortKey(releaseDate: string | null): number {
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

function sortSeriesNewestFirst(series: PokemonSeries[]): PokemonSeries[] {
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

function formatSeriesReleaseDate(releaseDate: string | null): string {
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

function SeriesTile({ series, onSelect }: { series: PokemonSeries; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="series-tile-glow w-full rounded-xl text-center shadow-[0_10px_28px_rgb(0_0_0_/_0.35)] transition-shadow hover:shadow-[0_14px_32px_rgb(0_0_0_/_0.42)]"
        >
            <div className="relative z-[1] flex flex-col items-center px-3 py-4">
                <div className="mb-3 flex h-20 w-full items-center justify-center">
                    {series.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={series.logo}
                            alt=""
                            className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                        />
                    ) : (
                        <span className="text-xs text-[var(--muted)]">No logo</span>
                    )}
                </div>
                <p className="text-sm font-medium leading-snug">{series.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatSeriesReleaseDate(series.releaseDate)}
                </p>
            </div>
        </button>
    );
}

function SetInfoField({
    label,
    value,
    valueClassName,
    className,
    allowWrap = false,
}: {
    label: string;
    value: React.ReactNode;
    valueClassName?: string;
    className?: string;
    allowWrap?: boolean;
}) {
    return (
        <div className={`min-w-0 ${className ?? ''}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                {label}
            </p>
            <p
                className={`mt-1 text-sm font-medium ${valueClassName ?? 'text-[var(--foreground)]'} ${
                    allowWrap ? 'line-clamp-2' : 'truncate'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function CollectionProgressBar({
    collected,
    total,
    fullWidth = false,
}: {
    collected: number;
    total: number;
    fullWidth?: boolean;
}) {
    const progressPercent = total > 0 ? Math.min((collected / total) * 100, 100) : 0;
    const isComplete = total > 0 && collected >= total;
    const checkpoints = [25, 50, 75, 100] as const;

    function checkpointPosition(checkpoint: number) {
        if (checkpoint >= 100) {
            return { right: '0px' };
        }

        return { left: `${checkpoint}%`, transform: 'translateX(-50%)' };
    }

    return (
        <div className="flex w-full flex-col items-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
                {collected.toLocaleString()} / {total.toLocaleString()} collected
            </p>
            <div className={`relative mt-2 w-full min-w-16 ${fullWidth ? '' : 'max-w-lg'}`}>
                <div
                    className={
                        isComplete
                            ? 'collection-progress-shooting-star'
                            : 'relative h-2 overflow-hidden rounded-full bg-[var(--border)]'
                    }
                >
                    {isComplete && (
                        <>
                            <span className="collection-progress-spark" aria-hidden="true" />
                            <span
                                className="collection-progress-spark-backdrop"
                                aria-hidden="true"
                            />
                        </>
                    )}
                    <div
                        className={
                            isComplete
                                ? 'collection-progress-shooting-star-inner'
                                : 'relative h-full'
                        }
                        role="progressbar"
                        aria-valuenow={collected}
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-label={`${collected} of ${total} cards collected`}
                    >
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                                isComplete
                                    ? 'collection-progress-fill-complete'
                                    : 'bg-[var(--accent)]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                        {checkpoints.map((checkpoint) => (
                            <div
                                key={checkpoint}
                                aria-hidden="true"
                                className={`pointer-events-none absolute top-0 z-10 h-full w-px ${
                                    progressPercent >= checkpoint
                                        ? 'bg-[var(--foreground)]/50'
                                        : 'bg-[var(--muted)]/35'
                                }`}
                                style={checkpointPosition(checkpoint)}
                            />
                        ))}
                    </div>
                </div>
                <div className="relative mt-1 h-3 w-full" aria-hidden="true">
                    {checkpoints.map((checkpoint) => (
                        <span
                            key={checkpoint}
                            className={`absolute text-[9px] font-medium tabular-nums ${
                                progressPercent >= checkpoint
                                    ? 'text-[var(--foreground)]'
                                    : 'text-[var(--muted)]'
                            }`}
                            style={checkpointPosition(checkpoint)}
                        >
                            {checkpoint}%
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BulkActionButton({
    label,
    disabled,
    showCooldownBar,
    cooldownProgress,
    onClick,
    hoverClassName,
}: {
    label: string;
    disabled: boolean;
    showCooldownBar: boolean;
    cooldownProgress: number;
    onClick: () => void;
    hoverClassName: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`relative overflow-hidden rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hoverClassName}`}
        >
            {showCooldownBar && (
                <span
                    className="absolute inset-y-0 left-0 bg-[var(--accent)]/25"
                    style={{ width: `${Math.max(0, Math.min(1, cooldownProgress)) * 100}%` }}
                    aria-hidden="true"
                />
            )}
            <span className="relative z-10">{label}</span>
        </button>
    );
}

function SetInfoBar({
    set,
    cards,
    stats,
    onAddAll,
    onRemoveAll,
    bulkOperating = null,
    bulkCooldownSource = null,
    bulkCooldownProgress = 0,
    isBulkCooldownActive = false,
    addAllRemainingCount = 0,
    ownedInSetCount = 0,
}: {
    set: PokemonSetSummary;
    cards: PokemonCardDetail[];
    stats: SetMarketStats;
    onAddAll?: () => void;
    onRemoveAll?: () => void;
    bulkOperating?: 'add' | 'remove' | null;
    bulkCooldownSource?: 'add' | 'remove' | null;
    bulkCooldownProgress?: number;
    isBulkCooldownActive?: boolean;
    addAllRemainingCount?: number;
    ownedInSetCount?: number;
}) {
    const totalCards = set.total ?? cards.length;
    const isBulkBusy = bulkOperating !== null;

    return (
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 p-3 backdrop-blur-sm sm:p-4">
            <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-0">
                    <div className="min-w-0 md:pr-5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                            <SetInfoField label="Set Name" value={set.name} />
                            <SetInfoField
                                label="Series"
                                value={set.series}
                                valueClassName="text-[var(--accent)]"
                            />
                            <SetInfoField
                                label="Release Date"
                                value={formatSeriesReleaseDate(set.releaseDate)}
                                className="col-span-2 sm:col-span-1"
                            />
                            <div className="col-span-2 grid grid-cols-2 gap-4 sm:col-span-3">
                                <SetInfoField
                                    label="Cards"
                                    value={formatSetCardCount(set, cards.length)}
                                />
                                <SetInfoField
                                    label="Most Expensive Card"
                                    value={stats.mostExpensiveName ?? ''}
                                    allowWrap
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center gap-4 border-[var(--border)] md:border-l md:pl-5">
                        <SetInfoField
                            label="Full Set Market Value"
                            value={formatTcgPlayerMarketPrice(stats.fullSetValue)}
                            valueClassName="text-[var(--success)]"
                        />
                        <SetInfoField
                            label="Your Set Value"
                            value={formatTcgPlayerMarketPrice(stats.yourSetValue)}
                            valueClassName="text-[var(--success)]"
                        />
                    </div>
                </div>

                {(onAddAll || onRemoveAll) && (
                    <div className="grid grid-cols-2 gap-3">
                        {onAddAll && (
                            <BulkActionButton
                                label={
                                    bulkOperating === 'add'
                                        ? 'Adding…'
                                        : addAllRemainingCount === 0
                                          ? 'All owned'
                                          : `Add all (${addAllRemainingCount})`
                                }
                                disabled={
                                    isBulkBusy || isBulkCooldownActive || addAllRemainingCount === 0
                                }
                                showCooldownBar={
                                    isBulkCooldownActive && bulkCooldownSource === 'remove'
                                }
                                cooldownProgress={bulkCooldownProgress}
                                onClick={onAddAll}
                                hoverClassName="hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                            />
                        )}
                        {onRemoveAll && (
                            <BulkActionButton
                                label={
                                    bulkOperating === 'remove'
                                        ? 'Removing…'
                                        : ownedInSetCount === 0
                                          ? 'None owned'
                                          : `Remove all (${ownedInSetCount})`
                                }
                                disabled={
                                    isBulkBusy || isBulkCooldownActive || ownedInSetCount === 0
                                }
                                showCooldownBar={
                                    isBulkCooldownActive && bulkCooldownSource === 'add'
                                }
                                cooldownProgress={bulkCooldownProgress}
                                onClick={onRemoveAll}
                                hoverClassName="hover:border-[var(--danger)] hover:text-[var(--foreground)]"
                            />
                        )}
                    </div>
                )}

                {totalCards > 0 && (
                    <CollectionProgressBar
                        collected={stats.collectedCount}
                        total={totalCards}
                        fullWidth
                    />
                )}
            </div>
        </div>
    );
}

function SetTile({ set, onSelect }: { set: PokemonSetSummary; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="series-tile-glow w-full rounded-xl text-center shadow-[0_10px_28px_rgb(0_0_0_/_0.35)] transition-shadow hover:shadow-[0_14px_32px_rgb(0_0_0_/_0.42)]"
        >
            <div className="relative z-[1] flex flex-col items-center px-3 py-4">
                <div className="mb-3 flex h-20 w-full items-center justify-center">
                    {set.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={set.logo}
                            alt=""
                            className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                        />
                    ) : set.symbol ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={set.symbol}
                            alt=""
                            className="h-10 w-10 object-contain drop-shadow-md"
                        />
                    ) : (
                        <span className="text-xs text-[var(--muted)]">No logo</span>
                    )}
                </div>
                <p className="text-sm font-medium leading-snug">{set.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatSeriesReleaseDate(set.releaseDate)}
                </p>
                {set.total != null && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{set.total} cards</p>
                )}
            </div>
        </button>
    );
}

export function TestApp() {
    const { user, setUser, tab, configError, setPageLoading, seriesResetCount } = useApp();
    const [detailSelection, setDetailSelection] = useState<CardDetailSelection | null>(null);
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchAllResults, setSearchAllResults] = useState<PokemonCardDetail[]>([]);
    const [searchMeta, setSearchMeta] = useState<SearchResultMeta | null>(null);
    const searchCacheRef = useRef(new Map<string, SearchResultCache>());
    const searchInFlightRef = useRef<string | null>(null);
    const userCardsCacheRef = useRef<{
        userId: string;
        owned: UserCard[];
        wishlist: UserCard[];
    } | null>(null);
    const tabRef = useRef<AppTab>(tab);
    tabRef.current = tab;
    const userCardsInFlightRef = useRef<string | null>(null);
    const [userCards, setUserCards] = useState<UserCard[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchSortField, setSearchSortField] = useState<SetCardSortField>('name');
    const [searchSortDirection, setSearchSortDirection] = useState<SetCardSortDirection>('asc');
    const [collectionLoading, setCollectionLoading] = useState(false);
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
    const [message, setMessage] = useState<string | null>(null);
    const [wishlistByExternalId, setWishlistByExternalId] = useState<Record<string, string>>({});
    const [ownedByExternalId, setOwnedByExternalId] = useState<Record<string, string>>({});

    const setMarketStats = useMemo(() => {
        if (!selectedSet) {
            return null;
        }

        const owned = userCardsCacheRef.current?.owned ?? [];
        return computeSetMarketStats(setCards, owned);
    }, [selectedSet, setCards, ownedByExternalId]);

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

    const sortedSearchResults = useMemo(
        () => sortSetCards(searchAllResults, searchSortField, searchSortDirection),
        [searchAllResults, searchSortField, searchSortDirection],
    );

    const displayedSearchResults = useMemo(() => {
        const start = (currentPage - 1) * SEARCH_DISPLAY_PAGE_SIZE;
        return sortedSearchResults.slice(start, start + SEARCH_DISPLAY_PAGE_SIZE);
    }, [sortedSearchResults, currentPage]);

    const bulkCooldownProgress =
        bulkCooldown && bulkCooldown.endsAt > Date.now()
            ? (bulkCooldown.endsAt - Date.now()) / BULK_OPERATION_COOLDOWN_MS
            : 0;
    const isBulkCooldownActive = bulkCooldownProgress > 0;

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

    function startBulkCooldown(source: 'add' | 'remove') {
        setBulkCooldown({
            source,
            endsAt: Date.now() + BULK_OPERATION_COOLDOWN_MS,
        });
    }

    const collectionNavigationCards = useMemo(
        () => userCards.map((card) => userCardToPreview(card)),
        [userCards],
    );

    const setCardsToAddCount = useMemo(() => {
        return setCards.filter((card) => ownedByExternalId[card.id] == null).length;
    }, [setCards, ownedByExternalId]);

    const setCardsOwnedCount = useMemo(() => {
        return setCards.filter((card) => ownedByExternalId[card.id] != null).length;
    }, [setCards, ownedByExternalId]);

    function handleCardSortChange(
        field: SetCardSortField,
        activeField: SetCardSortField,
        setField: (field: SetCardSortField) => void,
        setDirection: React.Dispatch<React.SetStateAction<SetCardSortDirection>>,
    ) {
        if (field === activeField) {
            setDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setField(field);
        setDirection('asc');
    }

    function handleSetCardSortChange(field: SetCardSortField) {
        handleCardSortChange(field, setCardSortField, setSetCardSortField, setSetCardSortDirection);
    }

    function handleSearchSortChange(field: SetCardSortField) {
        handleCardSortChange(field, searchSortField, setSearchSortField, setSearchSortDirection);
        setCurrentPage(1);
    }

    function applyBulkOwnedCacheUpdate(
        added: UserCard[] = [],
        removedExternalIds: Set<string> = new Set(),
    ) {
        if (!user) {
            return;
        }

        if (!userCardsCacheRef.current) {
            userCardsCacheRef.current = {
                userId: user.id,
                owned: [],
                wishlist: [],
            };
        }

        const cache = userCardsCacheRef.current;
        const existingIds = new Set(cache.owned.map((entry) => entry.external_card_id));
        const newCards = added.filter((entry) => !existingIds.has(entry.external_card_id));

        cache.owned = [
            ...newCards,
            ...cache.owned.filter((entry) => !removedExternalIds.has(entry.external_card_id)),
        ];
        applyUserCardsCache(tabRef.current);
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

    function applyUserCardsCache(activeTab: AppTab) {
        const cache = userCardsCacheRef.current;

        if (!cache) {
            return;
        }

        setWishlistByExternalId(
            Object.fromEntries(cache.wishlist.map((entry) => [entry.external_card_id, entry.id])),
        );
        setOwnedByExternalId(
            Object.fromEntries(cache.owned.map((entry) => [entry.external_card_id, entry.id])),
        );

        if (activeTab === 'collection') {
            setUserCards(cache.owned);
        } else if (activeTab === 'wishlist') {
            setUserCards(cache.wishlist);
        }
    }

    function patchUserCardsCache(status: 'owned' | 'wishlist', patch: UserCardPatch) {
        if (!user) {
            return;
        }

        if (!userCardsCacheRef.current) {
            userCardsCacheRef.current = {
                userId: user.id,
                owned: [],
                wishlist: [],
            };
        }

        const cache = userCardsCacheRef.current;
        const listKey = status === 'owned' ? 'owned' : 'wishlist';

        if (patch.action === 'add') {
            cache[listKey] = [
                patch.card,
                ...cache[listKey].filter(
                    (entry) => entry.external_card_id !== patch.card.external_card_id,
                ),
            ];
        } else {
            cache[listKey] = cache[listKey].filter((entry) => entry.id !== patch.userCardId);
        }

        applyUserCardsCache(tabRef.current);
    }

    function handleOwnedChange(patch: UserCardPatch) {
        patchUserCardsCache('owned', patch);
    }

    function handleWishlistChange(patch: UserCardPatch) {
        patchUserCardsCache('wishlist', patch);
    }

    function handleUserCardDeleted(patch: UserCardPatch) {
        if (patch.action !== 'remove' || !userCardsCacheRef.current) {
            return;
        }

        const removedFromOwned = userCardsCacheRef.current.owned.some(
            (entry) => entry.id === patch.userCardId,
        );

        patchUserCardsCache(removedFromOwned ? 'owned' : 'wishlist', patch);
    }

    async function refreshUserCards() {
        if (!user) {
            userCardsCacheRef.current = null;
            setUserCards([]);
            setWishlistByExternalId({});
            setOwnedByExternalId({});
            return;
        }

        if (userCardsCacheRef.current?.userId === user.id) {
            applyUserCardsCache(tabRef.current);
            return;
        }

        if (userCardsInFlightRef.current === user.id) {
            return;
        }

        userCardsInFlightRef.current = user.id;
        setCollectionLoading(true);
        setMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setMessage('You are not signed in. Sign in again and retry.');
                setUser(null);
                return;
            }

            const [wishlistCards, ownedCards] = await Promise.all([
                getMyUserCards(token, 'wishlist'),
                getMyUserCards(token, 'owned'),
            ]);

            userCardsCacheRef.current = {
                userId: user.id,
                owned: ownedCards,
                wishlist: wishlistCards,
            };
            applyUserCardsCache(tabRef.current);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to load cards.');
        } finally {
            userCardsInFlightRef.current = null;
            setCollectionLoading(false);
        }
    }

    function ensureUserCardsLoaded() {
        if (!user || userCardsCacheRef.current?.userId === user.id) {
            return;
        }

        if (userCardsInFlightRef.current === user.id) {
            return;
        }

        void refreshUserCards();
    }

    useEffect(() => {
        if (!user) {
            userCardsInFlightRef.current = null;
            userCardsCacheRef.current = null;
            setUserCards([]);
            setWishlistByExternalId({});
            setOwnedByExternalId({});
            return;
        }

        if (userCardsCacheRef.current?.userId === user.id) {
            applyUserCardsCache(tabRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        if (userCardsCacheRef.current?.userId === user.id) {
            applyUserCardsCache(tab);
            return;
        }

        if (tab === 'collection' || tab === 'wishlist') {
            void refreshUserCards();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, user]);

    useEffect(() => {
        if (!user || tab !== 'series') {
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
    }, [tab, user]);

    useEffect(() => {
        if (tab !== 'series') {
            setSelectedSeries(null);
            setSeriesSets([]);
            setSelectedSet(null);
            setSetCards([]);
        }
    }, [tab]);

    useEffect(() => {
        if (seriesResetCount === 0) {
            return;
        }

        setSelectedSeries(null);
        setSeriesSets([]);
        setSelectedSet(null);
        setSetCards([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [seriesResetCount]);

    useEffect(() => {
        if (!user || tab !== 'series' || !selectedSeries) {
            return;
        }

        const cached = seriesSetsCacheRef.current.get(selectedSeries.name);

        if (cached) {
            setSeriesSets(cached);
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
    }, [selectedSeries, tab, user]);

    useEffect(() => {
        if (!user || tab !== 'series' || !selectedSet) {
            return;
        }

        ensureUserCardsLoaded();

        const cached = setCardsCacheRef.current.get(selectedSet.id);

        if (cached) {
            setSetCards(cached);
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
    }, [selectedSet, tab, user]);

    useEffect(() => {
        setSetCardSearchQuery('');
        setSetCardOwnershipFilter('all');
        setSetCardSortField('number');
        setSetCardSortDirection('asc');
        setBulkCooldown(null);
    }, [selectedSet?.id]);

    useEffect(() => {
        setPageLoading(
            searchLoading ||
                collectionLoading ||
                seriesLoading ||
                seriesSetsLoading ||
                setCardsLoading,
        );

        return () => setPageLoading(false);
    }, [
        searchLoading,
        collectionLoading,
        seriesLoading,
        seriesSetsLoading,
        setCardsLoading,
        setPageLoading,
    ]);

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
    const paginationTop = showSearchPagination ? (
        <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages!}
            hasMore={false}
            onPageChange={goToPage}
            disabled={searchLoading}
            jumpInputId="search-jump-top"
        />
    ) : null;
    const paginationBottom = showSearchPagination ? (
        <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages!}
            hasMore={false}
            onPageChange={goToPage}
            disabled={searchLoading}
            jumpInputId="search-jump-bottom"
        />
    ) : null;
    const collectionTotal = tab === 'collection' ? getCollectionTotal(userCards) : 0;
    const collectionPricedCount = userCards.filter((card) => card.market_price != null).length;

    if (configError) {
        return (
            <Panel title="Configuration required">
                <p className="text-sm text-[var(--danger)]">{configError}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                    Copy <code className="rounded bg-white/5 px-1">.env.example</code> to{' '}
                    <code className="rounded bg-white/5 px-1">.env.local</code> and fill in your
                    Supabase URL and anon key.
                </p>
            </Panel>
        );
    }

    return (
        <div className="mx-auto grid max-w-6xl gap-6">
            {detailSelection && (
                <CardDetailModal
                    cardId={detailSelection.cardId}
                    preview={detailSelection.preview}
                    navigationCards={detailSelection.navigationCards}
                    onNavigate={(cardId, preview) =>
                        setDetailSelection((current) =>
                            current ? { ...current, cardId, preview } : null,
                        )
                    }
                    onClose={() => setDetailSelection(null)}
                />
            )}

            {tab === 'home' && <HomePage />}

            {tab === 'about' && <AboutPage />}

            {tab === 'contact' && <ContactPage />}

            {tab === 'changelog' && <ChangelogPage />}

            {user && (
                <>
                    {tab === 'search' && (
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
                                    Sorting and paging use the first{' '}
                                    {searchMeta.fetchedCount.toLocaleString()} of{' '}
                                    {searchMeta.totalCount.toLocaleString()} results. Try a more
                                    specific search to narrow the list.
                                </p>
                            )}
                            {paginationTop && <div className="mb-4">{paginationTop}</div>}
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
                                            wishlistUserCardId={
                                                wishlistByExternalId[card.id] ?? null
                                            }
                                            onOwnedChange={handleOwnedChange}
                                            onWishlistChange={handleWishlistChange}
                                            onViewDetails={(selected) =>
                                                setDetailSelection({
                                                    cardId: selected.id,
                                                    preview: selected,
                                                    navigationCards: sortedSearchResults,
                                                })
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                            {paginationBottom && <div className="mt-4">{paginationBottom}</div>}
                        </Panel>
                    )}

                    {tab === 'series' && (
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
                            {selectedSet && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSet(null);
                                        setSetCards([]);
                                    }}
                                    className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                                >
                                    <IoIosArrowBack className="h-4 w-4" aria-hidden="true" />
                                    Back to sets
                                </button>
                            )}
                            {selectedSeries && !selectedSet && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSeries(null);
                                        setSeriesSets([]);
                                    }}
                                    className="mb-4 flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
                                >
                                    <IoIosArrowBack className="h-4 w-4" aria-hidden="true" />
                                    Back to all series
                                </button>
                            )}

                            {!selectedSeries && !selectedSet && seriesLoading && (
                                <p className="text-sm text-[var(--muted)]">Loading series…</p>
                            )}
                            {!selectedSeries &&
                                !selectedSet &&
                                !seriesLoading &&
                                seriesList.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {seriesList.map((series) => (
                                            <SeriesTile
                                                key={series.name}
                                                series={series}
                                                onSelect={() => setSelectedSeries(series)}
                                            />
                                        ))}
                                    </div>
                                )}
                            {!selectedSeries &&
                                !selectedSet &&
                                !seriesLoading &&
                                seriesList.length === 0 && (
                                    <p className="text-sm text-[var(--muted)]">No series found.</p>
                                )}

                            {selectedSeries && !selectedSet && seriesSetsLoading && (
                                <p className="text-sm text-[var(--muted)]">Loading sets…</p>
                            )}
                            {selectedSeries &&
                                !selectedSet &&
                                !seriesSetsLoading &&
                                seriesSets.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                        {seriesSets.map((set) => (
                                            <SetTile
                                                key={set.id}
                                                set={set}
                                                onSelect={() => setSelectedSet(set)}
                                            />
                                        ))}
                                    </div>
                                )}
                            {selectedSeries &&
                                !selectedSet &&
                                !seriesSetsLoading &&
                                seriesSets.length === 0 && (
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
                                                    ownedUserCardId={
                                                        ownedByExternalId[card.id] ?? null
                                                    }
                                                    wishlistUserCardId={
                                                        wishlistByExternalId[card.id] ?? null
                                                    }
                                                    onOwnedChange={handleOwnedChange}
                                                    onWishlistChange={handleWishlistChange}
                                                    onViewDetails={(selected) =>
                                                        setDetailSelection({
                                                            cardId: selected.id,
                                                            preview: selected,
                                                            navigationCards: displayedSetCards,
                                                        })
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : setCards.length > 0 ? (
                                        <p className="text-sm text-[var(--muted)]">
                                            No cards match your filters.
                                        </p>
                                    ) : (
                                        <p className="text-sm text-[var(--muted)]">
                                            No cards found.
                                        </p>
                                    )}
                                </>
                            )}
                        </Panel>
                    )}

                    {(tab === 'collection' || tab === 'wishlist') && (
                        <Panel title={tab === 'collection' ? 'My collection' : 'My wishlist'}>
                            {tab === 'collection' && !collectionLoading && userCards.length > 0 && (
                                <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                                    <p className="text-sm text-[var(--muted)]">
                                        Collection Total · TCGPlayer
                                    </p>
                                    <p className="text-lg font-medium">
                                        {formatTcgPlayerMarketPrice(collectionTotal)}
                                    </p>
                                    {collectionPricedCount < userCards.length && (
                                        <p className="mt-1 text-xs text-[var(--muted)]">
                                            Based on {collectionPricedCount} of {userCards.length}{' '}
                                            cards with price data
                                        </p>
                                    )}
                                </div>
                            )}
                            {collectionLoading && (
                                <p className="text-sm text-[var(--muted)]">Loading...</p>
                            )}
                            {!collectionLoading && userCards.length === 0 && (
                                <p className="text-sm text-[var(--muted)]">No cards yet.</p>
                            )}
                            <div className="grid gap-3">
                                {userCards.map((card) => (
                                    <UserCardRow
                                        key={card.id}
                                        card={card}
                                        onDeleted={handleUserCardDeleted}
                                        onViewDetails={(selected) =>
                                            setDetailSelection({
                                                cardId: selected.external_card_id,
                                                preview: userCardToPreview(selected),
                                                navigationCards: collectionNavigationCards,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        </Panel>
                    )}
                </>
            )}

            {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        </div>
    );
}
