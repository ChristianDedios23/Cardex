'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useApp } from '@/components/app-shell/AppProvider';
import { UserCardsProvider } from '@/contexts/UserCardsContext';
import { CardDetailModal } from '@/components/CardDetailModal';
import { HomePage } from '@/components/app/shared/HomePage';
import { Panel } from '@/components/app/shared/Panel';
import { AboutPage } from '@/components/AboutPage';
import { ChangelogPage } from '@/components/ChangelogPage';
import { ContactPage } from '@/components/ContactPage';
import type { CardDetailSelection } from '@/components/app/types';

export type { CardDetailSelection } from '@/components/app/types';

function TabSkeleton() {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-40 animate-pulse rounded bg-white/5" />
        </div>
    );
}

const SearchTab = dynamic(() => import('@/components/app/tabs/SearchTab'), {
    loading: () => <TabSkeleton />,
});

const SeriesTab = dynamic(() => import('@/components/app/tabs/SeriesTab'), {
    loading: () => <TabSkeleton />,
});

const CollectionTab = dynamic(() => import('@/components/app/tabs/CollectionTab'), {
    loading: () => <TabSkeleton />,
});

const PokedexTab = dynamic(() => import('@/components/app/tabs/PokedexTab'), {
    loading: () => <TabSkeleton />,
});

export function TestApp() {
    const { user, tab, configError } = useApp();
    const [detailSelection, setDetailSelection] = useState<CardDetailSelection | null>(null);

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
        <UserCardsProvider>
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

                {user && tab === 'search' && <SearchTab onViewDetails={setDetailSelection} />}
                {user && tab === 'series' && <SeriesTab onViewDetails={setDetailSelection} />}
                {user && tab === 'pokedex' && <PokedexTab />}
                {user && (tab === 'collection' || tab === 'wishlist') && (
                    <CollectionTab onViewDetails={setDetailSelection} />
                )}
            </div>
        </UserCardsProvider>
    );
}
