'use client';

import { useState } from 'react';
import { getAccessToken } from '@/lib/supabase/client';
import {
    createUserCard,
    createUserCardSnapshot,
    deleteUserCard,
    type PokemonCard,
} from '@/lib/api';
import type { UserCardPatch } from '@/components/app/types';
import { formatTcgPlayerMarketPrice } from '@/components/app/card-utils';
import { CheckIcon, PlusIcon, StarIcon, XIcon } from '@/components/app/shared/icons';

export function CardResult({
    card,
    ownedUserCardId,
    wishlistUserCardId,
    onOwnedChange,
    onWishlistChange,
    onViewDetails,
}: {
    card: PokemonCard;
    ownedUserCardId: string | null;
    wishlistUserCardId: string | null;
    onOwnedChange: (patch: UserCardPatch) => void;
    onWishlistChange: (patch: UserCardPatch) => void;
    onViewDetails: (card: PokemonCard) => void;
}) {
    const [savingAction, setSavingAction] = useState<'owned' | 'wishlist' | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const imageUrl = card.images?.small ?? card.images?.large;
    const isSavingOwned = savingAction === 'owned';
    const isSavingWishlist = savingAction === 'wishlist';
    const isOwned = ownedUserCardId !== null;
    const isWishlisted = wishlistUserCardId !== null;

    async function toggleOwned() {
        setSavingAction('owned');
        setErrorMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setErrorMessage('Sign in to save cards.');
                return;
            }

            if (ownedUserCardId) {
                await deleteUserCard(token, ownedUserCardId);
                onOwnedChange({
                    action: 'remove',
                    userCardId: ownedUserCardId,
                    externalCardId: card.id,
                });
            } else {
                const saved = await createUserCard(token, {
                    external_card_id: card.id,
                    status: 'owned',
                    quantity: 1,
                    ...createUserCardSnapshot(card),
                });
                onOwnedChange({ action: 'add', card: saved });
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Failed to update collection.',
            );
        } finally {
            setSavingAction(null);
        }
    }

    async function toggleWishlist() {
        setSavingAction('wishlist');
        setErrorMessage(null);

        try {
            const token = await getAccessToken();

            if (!token) {
                setErrorMessage('Sign in to save cards.');
                return;
            }

            if (wishlistUserCardId) {
                await deleteUserCard(token, wishlistUserCardId);
                onWishlistChange({
                    action: 'remove',
                    userCardId: wishlistUserCardId,
                    externalCardId: card.id,
                });
            } else {
                const saved = await createUserCard(token, {
                    external_card_id: card.id,
                    status: 'wishlist',
                    ...createUserCardSnapshot(card),
                });
                onWishlistChange({ action: 'add', card: saved });
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update wishlist.');
        } finally {
            setSavingAction(null);
        }
    }

    return (
        <article className="flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card-frame)]">
            <div className="card-tile-art flex aspect-[3/4] items-center justify-center overflow-hidden rounded-t-lg bg-[var(--background)] p-2">
                {imageUrl ? (
                    <button
                        type="button"
                        onClick={() => onViewDetails(card)}
                        aria-label={`View details for ${card.name}`}
                        className="card-tile-shine block max-h-full max-w-full border-0 bg-transparent p-0"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={card.name}
                            className="block max-h-full max-w-full object-contain"
                        />
                    </button>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">
                        No image
                    </div>
                )}
            </div>

            <p className="truncate px-2 pt-2 text-center text-sm font-medium" title={card.name}>
                {card.name}
            </p>

            {(card.setSymbol || card.number) && (
                <p className="flex items-center justify-center gap-1 px-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                    {card.setSymbol && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={card.setSymbol}
                            alt=""
                            className="h-4 w-auto max-w-[1.25rem] shrink-0 object-contain"
                            aria-hidden="true"
                        />
                    )}
                    {card.number && (
                        <span>{card.setSymbol ? ` · #${card.number}` : `#${card.number}`}</span>
                    )}
                </p>
            )}

            {card.marketPrice != null ? (
                <p className="truncate px-2 pb-2 pt-0.5 text-center text-xs text-[var(--muted)]">
                    Market Price · {formatTcgPlayerMarketPrice(card.marketPrice)}
                </p>
            ) : (
                <p className="px-2 pb-2 text-center text-xs text-[var(--muted)]">
                    Price unavailable
                </p>
            )}

            <div className="mt-auto shrink-0 border-t border-[var(--border)]">
                <div className="grid min-h-12 grid-cols-2">
                    <button
                        type="button"
                        disabled={isSavingOwned}
                        onClick={toggleOwned}
                        title={isOwned ? 'Remove from collection' : 'Add to collection'}
                        aria-label={
                            isOwned
                                ? `Remove ${card.name} from collection`
                                : `Add ${card.name} to collection`
                        }
                        className={`group flex h-full min-h-12 w-full items-center justify-center transition-colors ${
                            isOwned
                                ? 'text-[var(--success)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]'
                                : 'text-[var(--success)] hover:bg-[var(--success)]/10'
                        } ${isSavingOwned ? 'opacity-50' : ''}`}
                    >
                        {isSavingOwned ? (
                            <span className="text-xs text-[var(--muted)]">…</span>
                        ) : isOwned ? (
                            <>
                                <span className="group-hover:hidden">
                                    <CheckIcon />
                                </span>
                                <span className="hidden group-hover:block">
                                    <XIcon />
                                </span>
                            </>
                        ) : (
                            <PlusIcon />
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={isSavingWishlist}
                        onClick={toggleWishlist}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-label={
                            isWishlisted
                                ? `Remove ${card.name} from wishlist`
                                : `Add ${card.name} to wishlist`
                        }
                        className={`flex h-full min-h-12 w-full items-center justify-center border-l border-[var(--border)] text-[var(--star)] transition-colors hover:bg-[var(--star)]/10 ${
                            isSavingWishlist ? 'opacity-50' : ''
                        }`}
                    >
                        {savingAction === 'wishlist' ? (
                            <span className="text-xs text-[var(--muted)]">…</span>
                        ) : (
                            <StarIcon filled={isWishlisted} />
                        )}
                    </button>
                </div>

                {errorMessage && (
                    <p className="border-t border-[var(--border)] px-2 py-1.5 text-center text-[10px] leading-tight text-[var(--danger)]">
                        {errorMessage}
                    </p>
                )}
            </div>
        </article>
    );
}
