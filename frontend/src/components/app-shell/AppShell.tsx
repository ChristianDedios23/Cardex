'use client';

import type { ReactNode } from 'react';
import { FaBookBookmark } from 'react-icons/fa6';
import { BsBackpack2 } from 'react-icons/bs';
import { HiMiniSparkles } from 'react-icons/hi2';
import { PiMagnifyingGlassBold } from 'react-icons/pi';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getEmailUsername } from '@/lib/email';
import { UI_ASSETS } from '@/lib/ui-assets';
import { useApp, type AppTab } from './AppProvider';
import { AppFooter } from './AppFooter';

const NAV_ITEMS: { id: AppTab; label: string }[] = [
    { id: 'search', label: 'Search' },
    { id: 'series', label: 'Series' },
    { id: 'collection', label: 'Collection' },
    { id: 'wishlist', label: 'Wishlist' },
];

const NAV_ICON_CLASS = 'h-4 w-4';

function SearchIcon() {
    return <PiMagnifyingGlassBold className={NAV_ICON_CLASS} aria-hidden="true" />;
}

function SeriesIcon() {
    return <FaBookBookmark className={NAV_ICON_CLASS} aria-hidden="true" />;
}

function BackpackIcon() {
    return <BsBackpack2 className={NAV_ICON_CLASS} aria-hidden="true" />;
}

function WishlistIcon() {
    return <HiMiniSparkles className={NAV_ICON_CLASS} aria-hidden="true" />;
}

const NAV_ICONS: Record<AppTab, () => ReactNode> = {
    search: SearchIcon,
    series: SeriesIcon,
    collection: BackpackIcon,
    wishlist: WishlistIcon,
};

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            aria-hidden="true"
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const { user, setUser, tab, setTab, sidebarCollapsed, setSidebarCollapsed, pageLoading } =
        useApp();

    const username = getEmailUsername(user?.email);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setTab('search');
    }

    return (
        <div className="flex min-h-screen">
            <aside
                className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)] transition-[width] duration-200 ${
                    sidebarCollapsed ? 'w-14' : 'w-64'
                }`}
            >
                <div className="relative h-14 shrink-0">
                    {!sidebarCollapsed && (
                        <div className="absolute inset-0 flex items-center justify-center px-3">
                            <Image
                                src={UI_ASSETS.brand.title}
                                alt="Cardex"
                                width={800}
                                height={300}
                                quality={100}
                                unoptimized
                                className="h-11 w-auto max-w-full object-contain"
                                priority
                            />
                        </div>
                    )}
                    <div
                        className={`relative z-10 flex h-full items-center ${
                            sidebarCollapsed ? 'justify-center px-2' : 'justify-end px-3'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed((value) => !value)}
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
                        >
                            <ChevronIcon collapsed={sidebarCollapsed} />
                        </button>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1 p-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = tab === item.id;
                        const isDisabled = !user;
                        const Icon = NAV_ICONS[item.id];

                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setTab(item.id)}
                                title={sidebarCollapsed ? item.label : undefined}
                                className={
                                    sidebarCollapsed
                                        ? `mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors ${
                                              isActive
                                                  ? 'bg-[var(--accent)]/50 text-white'
                                                  : 'bg-[var(--card)] text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'
                                          } disabled:cursor-not-allowed disabled:opacity-40`
                                        : `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                              isActive
                                                  ? 'bg-[var(--accent)]/50 font-medium text-white'
                                                  : 'text-[var(--foreground)] hover:bg-white/5'
                                          } disabled:cursor-not-allowed disabled:opacity-40`
                                }
                            >
                                {sidebarCollapsed ? (
                                    <Icon />
                                ) : (
                                    <>
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                                                isActive
                                                    ? 'bg-[var(--accent)]/30 text-white'
                                                    : 'bg-[var(--card)] text-[var(--muted)]'
                                            }`}
                                            aria-hidden="true"
                                        >
                                            <Icon />
                                        </span>
                                        <span>{item.label}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-end border-b border-[var(--border)] bg-[var(--card)] px-4">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <span
                                className="max-w-[12rem] truncate text-sm font-medium"
                                title={user.email ?? undefined}
                            >
                                {username}
                            </span>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <span className="text-sm text-[var(--muted)]">Not signed in</span>
                    )}
                </header>

                <div
                    className={`relative shrink-0 overflow-hidden bg-[var(--border)] transition-[height] duration-150 ${
                        pageLoading ? 'h-0.5' : 'h-0'
                    }`}
                    aria-hidden={!pageLoading}
                >
                    {pageLoading && (
                        <div className="page-loading-bar-track absolute inset-y-0 left-0 w-1/4 bg-[var(--accent)]" />
                    )}
                </div>

                <main className="min-h-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>

                <div className="mt-15 shrink-0">
                    <AppFooter />
                </div>
            </div>
        </div>
    );
}
