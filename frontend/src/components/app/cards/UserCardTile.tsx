'use client';

import { useState } from 'react';
import { getAccessToken } from '@/lib/supabase/client';
import { deleteUserCard, type UserCard } from '@/lib/api';
import type { UserCardPatch } from '@/components/app/types';
import {
    formatCardStatus,
    formatCondition,
    formatTcgPlayerMarketPrice,
    formatUserCardQuantity,
} from '@/components/app/card-utils';

export function UserCardTile({
    card,
    onDeleted,
    onViewDetails,
}: {
    card: UserCard;
    onDeleted: (patch: UserCardPatch) => void;
    onViewDetails: (card: UserCard) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageUrl = card.card_image_url;

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
            onDeleted({
                action: 'remove',
                userCardId: card.id,
                externalCardId: card.external_card_id,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete card.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card-frame)]">
            <div className="card-tile-art flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-lg bg-[var(--background)] p-2">
                {imageUrl ? (
                    <button
                        type="button"
                        onClick={() => onViewDetails(card)}
                        aria-label={`View details for ${card.card_name ?? 'card'}`}
                        className="card-tile-shine block max-h-full max-w-full border-0 bg-transparent p-0"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={card.card_name ?? 'Card'}
                            className="block max-h-full max-w-full object-contain"
                        />
                    </button>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
                        No image
                    </div>
                )}
            </div>

            <p
                className="truncate px-2 pt-2 text-center text-sm font-medium"
                title={card.card_name ?? 'Unknown card'}
            >
                {card.card_name ?? 'Unknown card'}
            </p>

            {card.market_price != null ? (
                <p className="truncate px-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                    {formatTcgPlayerMarketPrice(card.market_price)}
                </p>
            ) : (
                <p className="px-2 pt-0.5 text-center text-xs text-[var(--muted)]">No price</p>
            )}

            <p className="truncate px-2 pb-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                {formatCardStatus(card.status)}
                {formatUserCardQuantity(card.quantity)}
                {card.condition ? ` · ${formatCondition(card.condition)}` : ''}
            </p>

            {error && <p className="px-2 pb-2 text-center text-xs text-[var(--danger)]">{error}</p>}

            <div className="mt-auto shrink-0 border-t border-[var(--border)]">
                <button
                    type="button"
                    disabled={loading}
                    onClick={handleDelete}
                    className="flex h-11 w-full items-center justify-center text-xs text-[var(--danger)] transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                    Remove
                </button>
            </div>
        </article>
    );
}
