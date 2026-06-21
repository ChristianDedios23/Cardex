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
import { AuthPanel } from '@/components/AuthPanel';
import { useApp, type AppTab } from './AppProvider';
import { AppFooter } from './AppFooter';

type NavTab = Exclude<AppTab, 'home' | 'about' | 'contact'>;

const NAV_ITEMS: { id: NavTab; label: string }[] = [
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

const NAV_ICONS: Record<NavTab, () => ReactNode> = {
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
    const {
        user,
        setUser,
        tab,
        setTab,
        authDialog,
        setAuthDialog,
        sidebarCollapsed,
        setSidebarCollapsed,
        pageLoading,
    } = useApp();

    const username = getEmailUsername(user?.email);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setTab('home');
    }

    function goHome() {
        setTab('home');
    }

    function handleNavClick(itemId: NavTab) {
        setTab(itemId);

        if (
            !sidebarCollapsed &&
            typeof window !== 'undefined' &&
            window.matchMedia('(max-width: 767px)').matches
        ) {
            setSidebarCollapsed(true);
        }
    }

    return (
        <div className="flex min-h-screen">
            <aside
                className={`flex h-screen shrink-0 flex-col bg-[var(--background)] transition-[width] duration-200 ${
                    sidebarCollapsed
                        ? 'sticky top-0 w-14 border-r border-[var(--border)]'
                        : 'sticky top-0 w-64 border-r border-[var(--border)] max-md:fixed max-md:inset-0 max-md:z-40 max-md:w-full max-md:border-r-0'
                }`}
            >
                <div
                    className={`flex h-14 shrink-0 items-center ${
                        sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-3'
                    }`}
                >
                    {!sidebarCollapsed && (
                        <button
                            type="button"
                            onClick={goHome}
                            aria-label="Go to home"
                            className="flex min-w-0 flex-1 items-center justify-center transition-opacity hover:opacity-90"
                        >
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
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed((value) => !value)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
                    >
                        <ChevronIcon collapsed={sidebarCollapsed} />
                    </button>
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
                                onClick={() => handleNavClick(item.id)}
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

            <div
                className={`flex min-h-screen min-w-0 flex-1 flex-col ${
                    !sidebarCollapsed ? 'max-md:invisible' : ''
                }`}
            >
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
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setAuthDialog('signin')}
                                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-white/5"
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthDialog('signup')}
                                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
                            >
                                Register
                            </button>
                        </div>
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

            {authDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setAuthDialog(null)}
                    role="presentation"
                >
                    <div
                        className="w-full max-w-sm"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-dialog-title"
                    >
                        <AuthPanel
                            key={authDialog}
                            initialMode={authDialog}
                            onAuthChange={setUser}
                            onClose={() => setAuthDialog(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
