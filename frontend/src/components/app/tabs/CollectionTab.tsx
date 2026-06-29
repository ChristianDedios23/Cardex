'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/components/app-shell/AppProvider';
import { useUserCards } from '@/contexts/UserCardsContext';
import { Panel } from '@/components/app/shared/Panel';
import { UserCardRow } from '@/components/app/cards/UserCardRow';
import { UserCardTile } from '@/components/app/cards/UserCardTile';
import { CollectionToolbar } from '@/components/app/collection/CollectionToolbar';
import {
    getCollectionTotal,
    formatTcgPlayerMarketPrice,
    sortUserCards,
    userCardToPreview,
} from '@/components/app/card-utils';
import type {
    CardDetailSelection,
    SetCardSortDirection,
    UserCardSortField,
    UserCardViewMode,
} from '@/components/app/types';
import type { UserCard } from '@/lib/api';

type CollectionTabProps = {
    onViewDetails: (selection: CardDetailSelection) => void;
};

export default function CollectionTab({ onViewDetails }: CollectionTabProps) {
    const { tab, setPageLoading } = useApp();
    const { userCards, collectionLoading, collectionMessage, handleUserCardDeleted } =
        useUserCards();

    const [viewMode, setViewMode] = useState<UserCardViewMode>('grid');
    const [sortField, setSortField] = useState<UserCardSortField>('name');
    const [sortDirection, setSortDirection] = useState<SetCardSortDirection>('asc');

    const collectionNavigationCards = useMemo(
        () => userCards.map((card) => userCardToPreview(card)),
        [userCards],
    );

    const displayedCards = useMemo(
        () => sortUserCards(userCards, sortField, sortDirection),
        [userCards, sortField, sortDirection],
    );

    const collectionTotal = tab === 'collection' ? getCollectionTotal(userCards) : 0;
    const collectionPricedCount = userCards.filter((card) => card.market_price != null).length;
    const panelTitle = tab === 'collection' ? 'My Collection' : 'My Wishlist';

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

    function handleSortChange(field: UserCardSortField) {
        if (field === sortField) {
            setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortField(field);
        setSortDirection('asc');
    }

    return (
        <>
            <Panel
                header={
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h2 className="text-lg font-medium">{panelTitle}</h2>
                        {userCards.length > 0 && (
                            <CollectionToolbar
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                sortField={sortField}
                                sortDirection={sortDirection}
                                onSortChange={handleSortChange}
                            />
                        )}
                    </div>
                }
            >
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
                {collectionLoading && <p className="text-sm text-[var(--muted)]">Loading...</p>}
                {!collectionLoading && userCards.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">No cards yet.</p>
                )}
                {!collectionLoading && userCards.length > 0 && viewMode === 'list' && (
                    <div className="grid gap-3">
                        {displayedCards.map((card) => (
                            <UserCardRow
                                key={card.id}
                                card={card}
                                onDeleted={handleUserCardDeleted}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
                {!collectionLoading && userCards.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {displayedCards.map((card) => (
                            <UserCardTile
                                key={card.id}
                                card={card}
                                onDeleted={handleUserCardDeleted}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                )}
            </Panel>
            {collectionMessage && (
                <p className="text-sm text-[var(--muted)]">{collectionMessage}</p>
            )}
        </>
    );
}
