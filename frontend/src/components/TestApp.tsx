'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, getAccessToken } from '@/lib/supabase/client';
import {
    createUserCard,
    deleteUserCard,
    getMyUserCards,
    searchCards,
    type PokemonCard,
    type UserCard,
} from '@/lib/api';

type Tab = 'search' | 'collection' | 'wishlist';

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

function CardResult({ card, onSaved }: { card: PokemonCard; onSaved: () => void }) {
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const imageUrl = card.images?.small ?? card.images?.large;

    async function save(status: 'owned' | 'wishlist') {
        setLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setErrorMessage('You are not signed in. Sign in again and retry.');
                return;
            }

            await createUserCard(token, {
                external_card_id: card.id,
                status,
                quantity: status === 'owned' ? 1 : undefined,
            });
            setSuccessMessage(
                status === 'owned' ? 'Added to your collection.' : 'Added to your wishlist.',
            );
            onSaved();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to save card.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex gap-4 rounded-lg border border-[var(--border)] p-3">
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={card.name} className="h-24 w-auto rounded object-contain" />
            ) : (
                <div className="flex h-24 w-16 items-center justify-center rounded bg-white/5 text-xs text-[var(--muted)]">
                    No image
                </div>
            )}
            <div className="flex flex-1 flex-col justify-between">
                <div>
                    <p className="font-medium">{card.name}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => save('owned')}
                        className="rounded-md bg-[var(--success)] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                    >
                        Add owned
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => save('wishlist')}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50"
                    >
                        Add wishlist
                    </button>
                </div>
                {successMessage && (
                    <p className="mt-2 text-xs text-[var(--success)]">{successMessage}</p>
                )}
                {errorMessage && (
                    <p className="mt-2 text-xs text-[var(--danger)]">{errorMessage}</p>
                )}
            </div>
        </div>
    );
}

function formatCardStatus(status: UserCard['status']): string {
    return status === 'owned' ? 'In collection' : 'On wishlist';
}

function formatCondition(condition: string): string {
    return condition.replace(/_/g, ' ');
}

function UserCardRow({ card, onDeleted }: { card: UserCard; onDeleted: () => void }) {
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
            onDeleted();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete card.');
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

export function TestApp() {
    const [user, setUser] = useState<User | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>('search');
    const [query, setQuery] = useState('pikachu');
    const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
    const [userCards, setUserCards] = useState<UserCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

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
                setUser(session?.user ?? null);
            });

            return () => subscription.unsubscribe();
        } catch (error) {
            setConfigError(error instanceof Error ? error.message : 'Configuration error');
        }
    }, []);

    async function loadUserCards(status?: 'owned' | 'wishlist') {
        if (!user) return;

        setLoading(true);
        setMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setMessage('You are not signed in. Sign in again and retry.');
                setUser(null);
                return;
            }

            const cards = await getMyUserCards(token, status);
            setUserCards(cards);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Failed to load cards.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            setUserCards([]);
            return;
        }

        if (tab === 'collection') {
            loadUserCards('owned');
        } else if (tab === 'wishlist') {
            loadUserCards('wishlist');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, tab]);

    async function handleSearch(event: React.FormEvent) {
        event.preventDefault();

        const trimmed = query.trim();

        if (trimmed.length < 3) {
            setMessage('Search query must be at least 3 characters.');
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const cards = await searchCards(trimmed);
            setSearchResults(cards);
            if (cards.length === 0) {
                setMessage('No cards found.');
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Search failed.');
        } finally {
            setLoading(false);
        }
    }

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
                                    disabled={loading || query.trim().length < 3}
                                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                                >
                                    Search
                                </button>
                            </form>
                            <p className="mb-4 text-sm text-[var(--muted)]">
                                Enter at least 3 characters to search.
                            </p>
                            <div className="grid gap-3">
                                {searchResults.map((card) => (
                                    <CardResult
                                        key={card.id}
                                        card={card}
                                        onSaved={() => {
                                            if (tab !== 'search') loadUserCards();
                                        }}
                                    />
                                ))}
                            </div>
                        </Panel>
                    )}

                    {(tab === 'collection' || tab === 'wishlist') && (
                        <Panel title={tab === 'collection' ? 'My collection' : 'My wishlist'}>
                            {loading && <p className="text-sm text-[var(--muted)]">Loading...</p>}
                            {!loading && userCards.length === 0 && (
                                <p className="text-sm text-[var(--muted)]">No cards yet.</p>
                            )}
                            <div className="grid gap-3">
                                {userCards.map((card) => (
                                    <UserCardRow
                                        key={card.id}
                                        card={card}
                                        onDeleted={() =>
                                            loadUserCards(tab === 'collection' ? 'owned' : 'wishlist')
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
