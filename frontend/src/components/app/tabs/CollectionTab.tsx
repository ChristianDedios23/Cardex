'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/components/app-shell/AppProvider';
import { useUserCards } from '@/contexts/UserCardsContext';
import { Panel } from '@/components/app/shared/Panel';
import { BrandLogoHeader } from '@/components/app/shared/BrandLogoHeader';
import { UserCardRow } from '@/components/app/cards/UserCardRow';
import {
    getCollectionTotal,
    formatTcgPlayerMarketPrice,
    userCardToPreview,
} from '@/components/app/card-utils';
import type { CardDetailSelection } from '@/components/app/types';
import type { UserCard } from '@/lib/api';

type CollectionTabProps = {
    onViewDetails: (selection: CardDetailSelection) => void;
};

export default function CollectionTab({ onViewDetails }: CollectionTabProps) {
    const { tab, setPageLoading } = useApp();
    const {
        userCards,
        collectionLoading,
        collectionMessage,
        handleUserCardDeleted,
    } = useUserCards();

    const collectionNavigationCards = useMemo(
        () => userCards.map((card) => userCardToPreview(card)),
        [userCards],
    );

    const collectionTotal = tab === 'collection' ? getCollectionTotal(userCards) : 0;
    const collectionPricedCount = userCards.filter((card) => card.market_price != null).length;

    useEffect(() => {
        setPageLoading(collectionLoading);
        return () => setPageLoading(false);
    }, [collectionLoading, setPageLoading]);

    function handleViewDetails(card: UserCard) {
        onViewDetails({
            cardId: card.external_card_id,
            preview: userCardToPreview(card),
            navigationCards: collectionNavigationCards,
        });
    }

    return (
        <>
            <Panel title={tab === 'collection' ? 'My collection' : 'My wishlist'}>
                {tab === 'collection' && !collectionLoading && userCards.length > 0 && (
                    <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                        <p className="text-sm text-[var(--muted)]">Collection Total · TCGPlayer</p>
                        <p className="text-lg font-medium">
                            {formatTcgPlayerMarketPrice(collectionTotal)}
                        </p>
                        {collectionPricedCount < userCards.length && (
                            <p className="mt-1 text-xs text-[var(--muted)]">
                                Based on {collectionPricedCount} of {userCards.length} cards with
                                price data
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
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            </Panel>
            {collectionMessage && (
                <p className="text-sm text-[var(--muted)]">{collectionMessage}</p>
            )}
        </>
    );
}
