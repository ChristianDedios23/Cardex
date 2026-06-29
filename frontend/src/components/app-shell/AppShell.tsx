'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { FaBookBookmark } from 'react-icons/fa6';
import { BsBackpack2 } from 'react-icons/bs';
import { HiMiniSparkles } from 'react-icons/hi2';
import { PiClockClockwiseBold, PiMagnifyingGlassBold } from 'react-icons/pi';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getEmailUsername } from '@/lib/email';
import { getPathForTab } from '@/lib/routes';
import { UI_ASSETS } from '@/lib/ui-assets';
import { AuthPanel } from '@/components/AuthPanel';
import { useApp, type AppTab } from './AppProvider';
import { AppFooter } from './AppFooter';
import { ScrollToTopButton } from './ScrollToTopButton';
import { SessionSplash } from './SessionSplash';

type NavTab = Exclude<AppTab, 'home' | 'about' | 'contact'>;

const MAIN_NAV_ITEMS: { id: Exclude<NavTab, 'changelog'>; label: string }[] = [
    { id: 'search', label: 'Search' },
    { id: 'series', label: 'Series' },
    { id: 'pokedex', label: 'Pokédex' },
    { id: 'collection', label: 'Collection' },
    { id: 'wishlist', label: 'Wishlist' },
];

const BOTTOM_NAV_ITEMS: { id: 'changelog'; label: string }[] = [
    { id: 'changelog', label: 'Changelog' },
];

const NAV_ICON_CLASS = 'h-4 w-4';
const POKEDEX_NAV_ICON_CLASS = 'h-8 w-8';

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

function PokedexIcon() {
    return (
        <svg className={POKEDEX_NAV_ICON_CLASS} viewBox="0 0 76 76" aria-hidden="true">
            <path
                fill="currentColor"
                d="M 38,19C 48.4934,19 57,27.5066 57,38C 57,48.4934 48.4934,57 38,57C 27.5066,57 19,48.4934 19,38C 19,27.5066 27.5066,19 38,19 Z M 38,22.9583C 30.2275,22.9583 23.8319,28.8536 23.0407,36.4167L 30.2417,36.4167C 30.9752,32.8031 34.17,30.0833 38,30.0833C 41.83,30.0833 45.0248,32.8031 45.7583,36.4167L 52.9593,36.4167C 52.1681,28.8536 45.7725,22.9583 38,22.9583 Z M 23.0407,39.5833C 23.8319,47.1464 30.2275,53.0417 38,53.0417C 45.7725,53.0417 52.1681,47.1464 52.9593,39.5833L 45.7583,39.5834C 45.0248,43.1969 41.83,45.9167 38,45.9167C 34.17,45.9167 30.9752,43.1969 30.2417,39.5834L 23.0407,39.5833 Z M 38,33.25C 35.3766,33.25 33.25,35.3767 33.25,38C 33.25,40.6234 35.3766,42.75 38,42.75C 40.6233,42.75 42.75,40.6234 42.75,38C 42.75,35.3767 40.6233,33.25 38,33.25 Z M 38,35.625C 39.3117,35.625 40.375,36.6883 40.375,38C 40.375,39.3117 39.3117,40.375 38,40.375C 36.6883,40.375 35.625,39.3117 35.625,38C 35.625,36.6883 36.6883,35.625 38,35.625 Z"
            />
        </svg>
    );
}

function ChangelogIcon() {
    return <PiClockClockwiseBold className={NAV_ICON_CLASS} aria-hidden="true" />;
}

const NAV_ICONS: Record<NavTab, () => ReactNode> = {
    search: SearchIcon,
    series: SeriesIcon,
    pokedex: PokedexIcon,
    collection: BackpackIcon,
    wishlist: WishlistIcon,
    changelog: ChangelogIcon,
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
        requestSeriesReset,
    } = useApp();

    const mainRef = useRef<HTMLElement>(null);
    const username = getEmailUsername(user?.email);

    function collapseSidebarOnMobile() {
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            setSidebarCollapsed(true);
        }
    }

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUser(null);
        setTab('home');
        collapseSidebarOnMobile();
    }

    function goHome() {
        setTab('home');
        collapseSidebarOnMobile();
    }

    function handleNavClick(itemId: NavTab) {
        if (tab === itemId && itemId === 'series') {
            requestSeriesReset();
        }

        if (!sidebarCollapsed) {
            collapseSidebarOnMobile();
        }
    }

    function renderNavButton(item: { id: NavTab; label: string }, requiresAuth: boolean) {
        const isActive = tab === item.id;
        const isDisabled = requiresAuth && !user;
        const Icon = NAV_ICONS[item.id];
        const href = getPathForTab(item.id);

        const collapsedClassName = `mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors ${
            isActive
                ? 'bg-[var(--accent)]/50 text-white'
                : 'bg-[var(--card)] text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]'
        } disabled:cursor-not-allowed disabled:opacity-40`;

        const expandedClassName = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive
                ? 'bg-[var(--accent)]/50 font-medium text-white'
                : 'text-[var(--foreground)] hover:bg-white/5'
        } disabled:cursor-not-allowed disabled:opacity-40`;

        if (isDisabled) {
            return (
                <button
                    key={item.id}
                    type="button"
                    disabled
                    title={sidebarCollapsed ? item.label : undefined}
                    className={sidebarCollapsed ? collapsedClassName : expandedClassName}
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
        }

        return (
            <Link
                key={item.id}
                href={href}
                onClick={() => handleNavClick(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={sidebarCollapsed ? collapsedClassName : expandedClassName}
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
            </Link>
        );
    }

    return (
        <div className="flex min-h-screen">
            <SessionSplash />
            <aside
                className={`flex h-screen shrink-0 flex-col border-[var(--border)] bg-[var(--background)] transition-[width] duration-200 ${
                    sidebarCollapsed
                        ? 'w-14 border-r max-md:fixed max-md:left-0 max-md:top-0 max-md:z-30 md:sticky md:top-0'
                        : 'w-64 border-r max-md:fixed max-md:inset-0 max-md:z-40 max-md:w-full max-md:border-r-0 md:sticky md:top-0'
                }`}
            >
                <div
                    className={`flex h-14 shrink-0 items-center ${
                        sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-3'
                    }`}
                >
                    {!sidebarCollapsed && (
                        <Link
                            href={getPathForTab('home')}
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
                        </Link>
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

                <nav className="flex min-h-0 flex-1 flex-col gap-1 p-2">
                    {MAIN_NAV_ITEMS.map((item) => renderNavButton(item, true))}

                    <div className="mt-auto border-t border-[var(--border)] pt-2">
                        {BOTTOM_NAV_ITEMS.map((item) => renderNavButton(item, false))}
                    </div>
                </nav>
            </aside>

            <div
                className={`flex min-h-screen min-w-0 flex-col md:flex-1 ${
                    sidebarCollapsed ? 'max-md:ml-14 max-md:w-[calc(100%-3.5rem)]' : 'max-md:hidden'
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

                <main ref={mainRef} className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>

                <ScrollToTopButton scrollContainerRef={mainRef} />

                <AppFooter />
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
