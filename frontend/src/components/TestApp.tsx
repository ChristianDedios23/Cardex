'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, getAccessToken } from '@/lib/supabase/client';
import {
    createUserCard,
    deleteUserCard,
    getMyUserCards,
    searchCards,
    type PaginatedPokemonCardSearch,
    type PokemonCard,
    type UserCard,
} from '@/lib/api';

type Tab = 'search' | 'collection' | 'wishlist';

type UserCardPatch =
    | { action: 'add'; card: UserCard }
    | { action: 'remove'; userCardId: string; externalCardId: string };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="mb-4 text-lg font-medium">{title}</h2>
            {children}
        </section>
    );
}

function AuthPanel({
    user,
    onAuthChange,
}: {
    user: User | null;
    onAuthChange: (user: User | null) => void;
}) {
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

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        onAuthChange(null);
        setMessage('Signed out.');
    }

    if (user) {
        return (
            <Panel title="Signed in">
                <p className="text-sm text-[var(--muted)]">{user.email}</p>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
                >
                    Sign out
                </button>
            </Panel>
        );
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
}: {
    card: PokemonCard;
    ownedUserCardId: string | null;
    wishlistUserCardId: string | null;
    onOwnedChange: (patch: UserCardPatch) => void;
    onWishlistChange: (patch: UserCardPatch) => void;
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
        <article className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-lg bg-[var(--card)] p-2">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={card.name}
                        className="max-h-full max-w-full object-contain"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
                        No image
                    </div>
                )}
            </div>

            <p className="truncate px-2 pt-2 text-center text-sm font-medium" title={card.name}>
                {card.name}
            </p>

            {card.marketPrice != null ? (
                <p className="truncate px-2 pb-2 text-center text-xs text-[var(--muted)]">
                    {formatTcgPlayerMarketPrice(card.marketPrice)} · TCGPlayer
                </p>
            ) : (
                <p className="px-2 pb-2 text-center text-xs text-[var(--muted)]">Price unavailable</p>
            )}

            <div className="overflow-hidden rounded-b-lg border-t border-[var(--border)]">
                <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
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
                        className={`group flex w-full min-w-0 items-center justify-center py-3 transition-colors ${
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
                        className={`flex w-full min-w-0 items-center justify-center py-3 text-[var(--star)] transition-colors hover:bg-[var(--star)]/10 ${
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
}: {
    card: UserCard;
    onDeleted: (patch: UserCardPatch) => void;
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={card.card_image_url}
                    alt={card.card_name ?? 'Card'}
                    className="h-20 w-auto rounded object-contain"
                />
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
                    &lt;
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
                    &gt;
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
    const [user, setUser] = useState<User | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('search');
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
    const tabRef = useRef<Tab>(tab);
    tabRef.current = tab;
    const loadedUserIdRef = useRef<string | null>(null);
    const [userCards, setUserCards] = useState<UserCard[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [wishlistByExternalId, setWishlistByExternalId] = useState<Record<string, string>>({});
    const [ownedByExternalId, setOwnedByExternalId] = useState<Record<string, string>>({});

    useEffect(() => {
        try {
            const supabase = createClient();

            supabase.auth.getUser().then(({ data, error }) => {
                if (error) {
                    setUser(null);
                    return;
                }
                setUser(data.user);
            });

            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, session) => {
                const nextUser = session?.user ?? null;
                setUser((current) =>
                    current?.id === nextUser?.id ? current : nextUser,
                );
            });

            return () => subscription.unsubscribe();
        } catch (error) {
            setConfigError(error instanceof Error ? error.message : 'Configuration error');
        }
    }, []);

    function applyUserCardsCache(activeTab: Tab) {
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
            setCollectionLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            loadedUserIdRef.current = null;
            userCardsCacheRef.current = null;
            setUserCards([]);
            setWishlistByExternalId({});
            setOwnedByExternalId({});
            return;
        }

        if (loadedUserIdRef.current === user.id && userCardsCacheRef.current) {
            applyUserCardsCache(tabRef.current);
            return;
        }

        loadedUserIdRef.current = user.id;
        void refreshUserCards();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        applyUserCardsCache(tab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, user]);

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

            if (result.data.length > 0) {
                setMessage(null);
            }
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
        <div className="grid gap-6">
            <AuthPanel user={user} onAuthChange={setUser} />

            {user && (
                <>
                    <div className="flex flex-wrap gap-2">
                        {(['search', 'collection', 'wishlist'] as Tab[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setTab(item)}
                                className={`rounded-lg px-4 py-2 text-sm capitalize ${
                                    tab === item
                                        ? 'bg-[var(--accent)] text-white'
                                        : 'border border-[var(--border)] hover:bg-white/5'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

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
