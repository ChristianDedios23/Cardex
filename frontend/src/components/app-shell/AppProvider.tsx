'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { getPathForTab, getTabFromPath, type AppTab } from '@/lib/routes';

export type { AppTab };
export type AuthDialogMode = 'signin' | 'signup';

type AppContextValue = {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    tab: AppTab;
    setTab: (tab: AppTab) => void;
    authDialog: AuthDialogMode | null;
    setAuthDialog: Dispatch<SetStateAction<AuthDialogMode | null>>;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
    configError: string | null;
    pageLoading: boolean;
    setPageLoading: Dispatch<SetStateAction<boolean>>;
    seriesResetCount: number;
    requestSeriesReset: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

function isMobileViewport() {
    return typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

export function AppProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const tab = useMemo(() => getTabFromPath(pathname), [pathname]);

    const setTab = useCallback(
        (nextTab: AppTab) => {
            const nextPath = getPathForTab(nextTab);
            if (pathname !== nextPath) {
                router.push(nextPath);
            }
        },
        [pathname, router],
    );

    const [user, setUser] = useState<User | null>(null);
    const [authDialog, setAuthDialog] = useState<AuthDialogMode | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(false);
    const [seriesResetCount, setSeriesResetCount] = useState(0);

    const requestSeriesReset = useCallback(() => {
        setSeriesResetCount((count) => count + 1);

        if (pathname.startsWith('/series') && pathname !== '/series') {
            router.push('/series');
        }
    }, [pathname, router]);

    useLayoutEffect(() => {
        if (tab === 'home' && isMobileViewport()) {
            setSidebarCollapsed(true);
        }
    }, [tab]);

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
                setUser((current) => (current?.id === nextUser?.id ? current : nextUser));
            });

            return () => subscription.unsubscribe();
        } catch (error) {
            setConfigError(error instanceof Error ? error.message : 'Configuration error');
        }
    }, []);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                tab,
                setTab,
                authDialog,
                setAuthDialog,
                sidebarCollapsed,
                setSidebarCollapsed,
                configError,
                pageLoading,
                setPageLoading,
                seriesResetCount,
                requestSeriesReset,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }

    return context;
}
