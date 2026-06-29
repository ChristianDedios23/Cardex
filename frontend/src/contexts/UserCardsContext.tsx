'use client';

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { useApp, type AppTab } from '@/components/app-shell/AppProvider';
import { getAccessToken } from '@/lib/supabase/client';
import { getMyUserCards, type UserCard } from '@/lib/api';
import type { UserCardPatch } from '@/components/app/types';

type UserCardsCache = {
    userId: string;
    owned: UserCard[];
    wishlist: UserCard[];
};

type UserCardsContextValue = {
    userCards: UserCard[];
    collectionLoading: boolean;
    ownedByExternalId: Record<string, string>;
    wishlistByExternalId: Record<string, string>;
    ownedCards: UserCard[];
    handleOwnedChange: (patch: UserCardPatch) => void;
    handleWishlistChange: (patch: UserCardPatch) => void;
    handleUserCardDeleted: (patch: UserCardPatch) => void;
    ensureUserCardsLoaded: () => void;
    applyBulkOwnedCacheUpdate: (
        added?: UserCard[],
        removedExternalIds?: Set<string>,
    ) => void;
    collectionMessage: string | null;
    setCollectionMessage: (message: string | null) => void;
};

const UserCardsContext = createContext<UserCardsContextValue | null>(null);

export function UserCardsProvider({ children }: { children: ReactNode }) {
    const { user, setUser, tab } = useApp();
    const userCardsCacheRef = useRef<UserCardsCache | null>(null);
    const userCardsInFlightRef = useRef<string | null>(null);
    const tabRef = useRef<AppTab>(tab);
    tabRef.current = tab;

    const [userCards, setUserCards] = useState<UserCard[]>([]);
    const [collectionLoading, setCollectionLoading] = useState(false);
    const [collectionMessage, setCollectionMessage] = useState<string | null>(null);
    const [wishlistByExternalId, setWishlistByExternalId] = useState<Record<string, string>>({});
    const [ownedByExternalId, setOwnedByExternalId] = useState<Record<string, string>>({});
    const [ownedCards, setOwnedCards] = useState<UserCard[]>([]);

    function applyUserCardsCache(activeTab: AppTab) {
        const cache = userCardsCacheRef.current;

        if (!cache) {
            return;
        }

        setOwnedCards(cache.owned);
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

    async function refreshUserCards() {
        if (!user) {
            userCardsCacheRef.current = null;
            setUserCards([]);
            setOwnedCards([]);
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
        setCollectionMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setCollectionMessage('You are not signed in. Sign in again and retry.');
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
            setCollectionMessage(error instanceof Error ? error.message : 'Failed to load cards.');
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
            setOwnedCards([]);
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

    return (
        <UserCardsContext.Provider
            value={{
                userCards,
                collectionLoading,
                ownedByExternalId,
                wishlistByExternalId,
                ownedCards,
                handleOwnedChange,
                handleWishlistChange,
                handleUserCardDeleted,
                ensureUserCardsLoaded,
                applyBulkOwnedCacheUpdate,
                collectionMessage,
                setCollectionMessage,
            }}
        >
            {children}
        </UserCardsContext.Provider>
    );
}

export function useUserCards() {
    const context = useContext(UserCardsContext);

    if (!context) {
        throw new Error('useUserCards must be used within UserCardsProvider');
    }

    return context;
}
