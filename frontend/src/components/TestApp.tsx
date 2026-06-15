'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import type { User } from '@supabase/supabase-js';
import { useApp, type AppTab } from '@/components/app-shell/AppProvider';
import { CardDetailModal } from '@/components/CardDetailModal';
import { createClient, getAccessToken } from '@/lib/supabase/client';
import {
    createUserCard,
    createUserCardSnapshot,
    deleteUserCard,
    getMyUserCards,
    searchCards,
    type PaginatedPokemonCardSearch,
    type PokemonCard,
    type UserCard,
} from '@/lib/api';

type UserCardPatch =
    | { action: 'add'; card: UserCard }
    | { action: 'remove'; userCardId: string; externalCardId: string };

type CardDetailSelection = {
    cardId: string;
    preview: PokemonCard | null;
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="mb-4 text-lg font-medium">{title}</h2>
            {children}
        </section>
    );
}

function AuthPanel({ onAuthChange }: { onAuthChange: (user: User | null) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        if (!data.session) {
            setMessage('Sign in succeeded but no session was returned. Confirm your email first.');
            return;
        }

        onAuthChange(data.user);
        setMessage('Signed in successfully.');
    }

    async function handleSignUp() {
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({ email, password });

        setLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        if (data.session && data.user) {
            onAuthChange(data.user);
            setMessage('Account created and signed in.');
        } else {
            setMessage('Account created. Check your email if confirmation is required.');
        }
    }

    return (
        <Panel title="Sign in">
            <div className="grid gap-3">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                />
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={loading || !email || !password}
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                        Sign in
                    </button>
                    <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={loading || !email || !password}
                        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                    >
                        Sign up
                    </button>
                </div>
                {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
            </div>
        </Panel>
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
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update collection.');
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
                    {formatTcgPlayerMarketPrice(card.marketPrice)} · TCGPlayer
                </p>
            ) : (
                <p className="px-2 pb-2 text-center text-xs text-[var(--muted)]">Price unavailable</p>
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

function getCollectionTotal(cards: UserCard[]): number {
    return cards.reduce((total, card) => {
        if (card.market_price == null) {
            return total;
        }

        const price =
            typeof card.market_price === 'number'
                ? card.market_price
                : Number(card.market_price);

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
                        {formatTcgPlayerMarketPrice(card.market_price)} · TCGPlayer
                    </p>
                )}
                <p className="text-sm text-[var(--muted)]">
                    {formatCardStatus(card.status)}
                    {card.quantity != null ? ` · ${card.quantity} copy${card.quantity === 1 ? '' : 'ies'}` : ''}
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

function getEffectiveTotalPages(
    meta: Omit<PaginatedPokemonCardSearch, 'data'>,
    currentPage: number,
): number {
    if (meta.totalCount > 0) {
        return Math.max(1, Math.ceil(meta.totalCount / meta.pageSize));
    }

    if (meta.hasMore) {
        return currentPage + 1;
    }

    return Math.max(1, currentPage);
}

function canGoToPage(
    page: number,
    currentPage: number,
    meta: Omit<PaginatedPokemonCardSearch, 'data'>,
): boolean {
    if (page < 1 || page === currentPage) {
        return false;
    }

    if (page === currentPage + 1 && meta.hasMore) {
        return true;
    }

    if (page === currentPage - 1) {
        return true;
    }

    return page <= getEffectiveTotalPages(meta, currentPage);
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
    const [jumpValue, setJumpValue] = useState('');

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

        setJumpValue('');
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
                    placeholder={String(currentPage)}
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

export function TestApp() {
    const { user, setUser, tab, configError, setPageLoading } = useApp();
    const [detailSelection, setDetailSelection] = useState<CardDetailSelection | null>(null);
    const [query, setQuery] = useState('pikachu');
    const [activeQuery, setActiveQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
    const [searchMeta, setSearchMeta] = useState<Omit<PaginatedPokemonCardSearch, 'data'> | null>(
        null,
    );
    const pageCacheRef = useRef(new Map<string, Map<number, PaginatedPokemonCardSearch>>());
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
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [wishlistByExternalId, setWishlistByExternalId] = useState<Record<string, string>>({});
    const [ownedByExternalId, setOwnedByExternalId] = useState<Record<string, string>>({});

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
        setPageLoading(searchLoading || collectionLoading);

        return () => setPageLoading(false);
    }, [searchLoading, collectionLoading, setPageLoading]);

    function normalizeQuery(value: string) {
        return value.trim().toLowerCase();
    }

    function applySearchResult(result: PaginatedPokemonCardSearch) {
        setSearchResults(result.data);
        setSearchMeta({
            page: result.page,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            hasMore: result.hasMore,
        });
        setCurrentPage(result.page);
    }

    function storePageInCache(normalized: string, page: number, result: PaginatedPokemonCardSearch) {
        let queryCache = pageCacheRef.current.get(normalized);

        if (!queryCache) {
            queryCache = new Map();
            pageCacheRef.current.set(normalized, queryCache);
        }

        queryCache.set(page, result);
    }

    function prefetchNextPage(searchQuery: string, result: PaginatedPokemonCardSearch) {
        if (!result.hasMore) {
            return;
        }

        const trimmed = searchQuery.trim();
        const normalized = normalizeQuery(trimmed);
        const nextPage = result.page + 1;

        if (pageCacheRef.current.get(normalized)?.has(nextPage)) {
            return;
        }

        void searchCards(trimmed, nextPage)
            .then((nextResult) => {
                storePageInCache(normalized, nextPage, nextResult);
            })
            .catch(() => {
                // Prefetch failures are silent; the user can still click Next to retry.
            });
    }

    async function fetchSearchPage(searchQuery: string, page: number) {
        const trimmed = searchQuery.trim();
        const normalized = normalizeQuery(trimmed);
        const cached = pageCacheRef.current.get(normalized)?.get(page);

        if (cached) {
            applySearchResult(cached);
            setMessage(null);
            prefetchNextPage(trimmed, cached);
            return;
        }

        const inFlightKey = `${normalized}:${page}`;

        if (searchInFlightRef.current === inFlightKey) {
            return;
        }

        searchInFlightRef.current = inFlightKey;
        setSearchLoading(true);
        setMessage(null);

        try {
            const result = await searchCards(trimmed, page);
            storePageInCache(normalized, page, result);
            applySearchResult(result);
            prefetchNextPage(trimmed, result);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Search failed.');
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
        const previousNormalized = activeQuery ? normalizeQuery(activeQuery) : null;

        if (previousNormalized && previousNormalized !== normalized) {
            pageCacheRef.current.delete(previousNormalized);
        }

        pageCacheRef.current.delete(normalized);

        setActiveQuery(trimmed);
        setCurrentPage(1);
        ensureUserCardsLoaded();
        await fetchSearchPage(trimmed, 1);
    }

    async function goToPage(page: number) {
        if (!activeQuery || searchLoading || !searchMeta) {
            return;
        }

        if (!canGoToPage(page, currentPage, searchMeta)) {
            return;
        }

        await fetchSearchPage(activeQuery, page);
    }

    const totalPages = searchMeta ? getEffectiveTotalPages(searchMeta, currentPage) : null;
    const hasSearchResults = searchResults.length > 0;
    const hasNoSearchResults =
        Boolean(activeQuery && searchMeta && !searchLoading && searchResults.length === 0);
    const showSearchPagination = Boolean(
        searchMeta &&
            activeQuery &&
            hasSearchResults &&
            (currentPage > 1 || searchMeta.hasMore || (totalPages ?? 0) > 1),
    );
    const paginationTop = showSearchPagination ? (
        <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages!}
            hasMore={searchMeta!.hasMore}
            onPageChange={goToPage}
            disabled={searchLoading}
            jumpInputId="search-jump-top"
        />
    ) : null;
    const paginationBottom = showSearchPagination ? (
        <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages!}
            hasMore={searchMeta!.hasMore}
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
                    onClose={() => setDetailSelection(null)}
                />
            )}

            {!user && <AuthPanel onAuthChange={setUser} />}

            {user && (
                <>
                    {tab === 'search' && (
                        <Panel title="Search cards">
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
                                {searchResults.map((card) => (
                                    <CardResult
                                        key={card.id}
                                        card={card}
                                        ownedUserCardId={ownedByExternalId[card.id] ?? null}
                                        wishlistUserCardId={wishlistByExternalId[card.id] ?? null}
                                        onOwnedChange={handleOwnedChange}
                                        onWishlistChange={handleWishlistChange}
                                        onViewDetails={(selected) =>
                                            setDetailSelection({
                                                cardId: selected.id,
                                                preview: selected,
                                            })
                                        }
                                    />
                                ))}
                            </div>
                            )}
                            {paginationBottom && <div className="mt-4">{paginationBottom}</div>}
                        </Panel>
                    )}

                    {(tab === 'collection' || tab === 'wishlist') && (
                        <Panel title={tab === 'collection' ? 'My collection' : 'My wishlist'}>
                            {tab === 'collection' && !collectionLoading && userCards.length > 0 && (
                                <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                                    <p className="text-sm text-[var(--muted)]">
                                        Collection total · TCGPlayer
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
