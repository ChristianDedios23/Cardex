'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type AppTab = 'search' | 'series' | 'collection' | 'wishlist';

type AppContextValue = {
    user: User | null;
    setUser: Dispatch<SetStateAction<User | null>>;
    tab: AppTab;
    setTab: Dispatch<SetStateAction<AppTab>>;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
    configError: string | null;
    pageLoading: boolean;
    setPageLoading: Dispatch<SetStateAction<boolean>>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [tab, setTab] = useState<AppTab>('search');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [configError, setConfigError] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(false);

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
                sidebarCollapsed,
                setSidebarCollapsed,
                configError,
                pageLoading,
                setPageLoading,
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
