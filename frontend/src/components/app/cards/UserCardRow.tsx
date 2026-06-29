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

export function UserCardRow({
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
        <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] p-3">
            {card.card_image_url ? (
                <button
                    type="button"
                    onClick={() => onViewDetails(card)}
                    aria-label={`View details for ${card.card_name ?? 'card'}`}
                    className="shrink-0 rounded border-0 bg-transparent p-0"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={card.card_image_url}
                        alt={card.card_name ?? 'Card'}
                        className="h-20 w-auto rounded object-contain transition-opacity hover:opacity-90"
                    />
                </button>
            ) : (
                <div className="flex h-20 w-14 items-center justify-center rounded bg-white/5 text-xs text-[var(--muted)]">
                    No image
                </div>
            )}
            <div className="flex-1">
                <p className="font-medium">{card.card_name ?? 'Unknown card'}</p>
                {card.market_price != null && (
                    <p className="text-sm text-[var(--muted)]">
                        Market Price · {formatTcgPlayerMarketPrice(card.market_price)}
                    </p>
                )}
                <p className="text-sm text-[var(--muted)]">
                    {formatCardStatus(card.status)}
                    {formatUserCardQuantity(card.quantity)}
                    {card.condition ? ` · ${formatCondition(card.condition)}` : ''}
                </p>
                {card.notes && <p className="mt-1 text-sm text-[var(--muted)]">{card.notes}</p>}
                {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
            </div>
            <button
                type="button"
                disabled={loading}
                onClick={handleDelete}
                className="rounded-md border border-[var(--danger)] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-red-500/10 disabled:opacity-50"
            >
                Remove
            </button>
        </div>
    );
}
