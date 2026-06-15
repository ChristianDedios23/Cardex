'use client';

import { useEffect, useState } from 'react';
import { getCardById, type PokemonCard, type PokemonCardDetail } from '@/lib/api';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) {
        return null;
    }

    return (
        <div className="grid gap-0.5 sm:grid-cols-[7rem_1fr]">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {label}
            </dt>
            <dd className="text-sm">{value}</dd>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[7rem_1fr]">
                    <div className="card-detail-skeleton h-3 w-16 rounded" />
                    <div className="card-detail-skeleton h-3 rounded" />
                </div>
            ))}
        </div>
    );
}

function LoadingSpinner({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
            <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
                aria-hidden="true"
            />
            {label}
        </span>
    );
}

type CardDetailModalProps = {
    cardId: string;
    preview: PokemonCard | null;
    onClose: () => void;
};

export function CardDetailModal({ cardId, preview, onClose }: CardDetailModalProps) {
    const [detail, setDetail] = useState<PokemonCardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            setDetail(null);

            try {
                const result = await getCardById(cardId);

                if (!cancelled) {
                    setDetail(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load card details.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [cardId]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const card = detail ?? preview;
    const imageUrl = card?.images?.large ?? card?.images?.small;
    const title = card?.name ?? 'Card details';
    const types = detail?.types ?? [];
    const subtypes = detail?.subtypes ?? [];
    const abilities = detail?.abilities ?? [];
    const attacks = detail?.attacks ?? [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            role="presentation"
        >
            <button
                type="button"
                aria-label="Close card details"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="card-detail-title"
                className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
            >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                    <div className="min-w-0">
                        <h2 id="card-detail-title" className="truncate text-lg font-semibold">
                            {title}
                        </h2>
                        {loading && !detail && (
                            <LoadingSpinner label="Loading details…" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-y-auto p-4">
                    {error && (
                        <p className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-red-500/10 px-3 py-2 text-sm text-[var(--danger)]">
                            {error}
                        </p>
                    )}

                    <div className="grid gap-6 sm:grid-cols-[minmax(0,14rem)_1fr]">
                        <div className="mx-auto w-full max-w-[14rem] sm:mx-0">
                            {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="w-full rounded-lg object-contain"
                                />
                            ) : (
                                <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-[var(--background)] text-sm text-[var(--muted)]">
                                    No image
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {loading && !detail ? (
                                <DetailSkeleton />
                            ) : (
                                <>
                            <dl className="space-y-3">
                                <DetailRow
                                    label="Set"
                                    value={
                                        detail?.setName
                                            ? detail.setSeries
                                                ? `${detail.setName} (${detail.setSeries})`
                                                : detail.setName
                                            : null
                                    }
                                />
                                <DetailRow
                                    label="Number"
                                    value={detail?.number ? `#${detail.number}` : card?.number ? `#${card.number}` : null}
                                />
                                <DetailRow label="Rarity" value={detail?.rarity} />
                                <DetailRow label="Artist" value={detail?.artist} />
                                <DetailRow
                                    label="Type"
                                    value={
                                        types.length > 0
                                            ? types.join(', ')
                                            : detail?.supertype ?? null
                                    }
                                />
                                <DetailRow
                                    label="Subtype"
                                    value={subtypes.length > 0 ? subtypes.join(', ') : null}
                                />
                                <DetailRow label="HP" value={detail?.hp} />
                                <DetailRow
                                    label="Market"
                                    value={
                                        (detail?.marketPrice ?? card?.marketPrice) != null
                                            ? `${formatPrice(detail?.marketPrice ?? card?.marketPrice ?? 0)} · TCGPlayer`
                                            : null
                                    }
                                />
                            </dl>

                            {detail?.flavorText && (
                                <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-sm italic text-[var(--muted)]">
                                    {detail.flavorText}
                                </blockquote>
                            )}

                            {abilities.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium">Abilities</h3>
                                    <ul className="space-y-2">
                                        {abilities.map((ability) => (
                                            <li
                                                key={ability.name}
                                                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
                                            >
                                                <p className="font-medium">{ability.name}</p>
                                                {ability.text && (
                                                    <p className="mt-1 text-[var(--muted)]">
                                                        {ability.text}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {attacks.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-medium">Attacks</h3>
                                    <ul className="space-y-2">
                                        {attacks.map((attack) => (
                                            <li
                                                key={attack.name}
                                                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
                                            >
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <p className="font-medium">{attack.name}</p>
                                                    {attack.damage && (
                                                        <p className="shrink-0 text-[var(--accent)]">
                                                            {attack.damage}
                                                        </p>
                                                    )}
                                                </div>
                                                {attack.text && (
                                                    <p className="mt-1 text-[var(--muted)]">
                                                        {attack.text}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {detail?.tcgplayerUrl && (
                                <a
                                    href={detail.tcgplayerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex text-sm text-[var(--accent)] hover:underline"
                                >
                                    View on TCGPlayer
                                </a>
                            )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
