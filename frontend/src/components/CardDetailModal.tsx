'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import {
    getCardById,
    peekCachedCardDetail,
    type PokemonCard,
    type PokemonCardDetail,
    type PokemonCardTypeModifier,
} from '@/lib/api';
import { getPokemonTypeIconUrl } from '@/lib/pokemonTypeIcons';
import { CardTilt } from '@/components/CardTilt';
import { RaritySymbol } from '@/components/RaritySymbol';

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

function formatReleaseDate(date: string): string {
    const [year, month, day] = date.split('/').map((part) => Number(part));

    if (!year || !month || !day) {
        return date;
    }

    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function TypeModifierList({ modifiers }: { modifiers: PokemonCardTypeModifier[] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {modifiers.map((modifier, index) => (
                <span key={`${modifier.type}-${index}`} className="inline-flex items-center gap-2">
                    <TypeIcon type={modifier.type} />
                    <span>{modifier.value}</span>
                </span>
            ))}
        </div>
    );
}

function TypeIcon({ type, className = 'h-4 w-4' }: { type: string; className?: string }) {
    const iconUrl = getPokemonTypeIconUrl(type);

    if (!iconUrl) {
        return null;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={iconUrl}
            alt=""
            className={`shrink-0 object-contain ${className}`}
            aria-hidden="true"
        />
    );
}

function AttackCostIcons({ cost }: { cost: string[] }) {
    if (cost.length === 0) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1">
            {cost.map((energy, index) => (
                <TypeIcon key={`${energy}-${index}`} type={energy} />
            ))}
        </span>
    );
}

function TypeValue({ types, supertype }: { types: string[]; supertype?: string | null }) {
    if (types.length > 0) {
        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {types.map((type) => (
                    <span key={type} className="inline-flex items-center gap-2">
                        <TypeIcon type={type} />
                        <span>{type}</span>
                    </span>
                ))}
            </div>
        );
    }

    if (supertype) {
        return <span>{supertype}</span>;
    }

    return null;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[5.5rem_1fr] sm:items-center sm:gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {label}
            </p>
            <div className="text-sm text-[var(--foreground)]">{children}</div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div
            className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3"
            aria-hidden="true"
        >
            {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[5.5rem_1fr]">
                    <div className="card-detail-skeleton h-3 w-14 rounded" />
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
    navigationCards?: PokemonCard[];
    onNavigate?: (cardId: string, preview: PokemonCard) => void;
    onClose: () => void;
};

const NAV_BUTTON_CLASS =
    'relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-lg transition-[filter,border-color,opacity] hover:brightness-110 hover:border-white/15 disabled:pointer-events-none disabled:opacity-40';

export function CardDetailModal({
    cardId,
    preview,
    navigationCards,
    onNavigate,
    onClose,
}: CardDetailModalProps) {
    const [detail, setDetail] = useState<PokemonCardDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const cached = peekCachedCardDetail(cardId);

        if (cached) {
            setDetail(cached);
            setLoading(false);
            setError(null);
            return;
        }

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

    const navigationIndex = useMemo(() => {
        if (!navigationCards?.length) {
            return -1;
        }

        return navigationCards.findIndex((card) => card.id === cardId);
    }, [navigationCards, cardId]);

    const hasPrevious = navigationIndex > 0;
    const hasNext =
        navigationIndex >= 0 &&
        navigationCards != null &&
        navigationIndex < navigationCards.length - 1;

    function goToPrevious() {
        if (!hasPrevious || !navigationCards || !onNavigate) {
            return;
        }

        const previousCard = navigationCards[navigationIndex - 1];
        onNavigate(previousCard.id, previousCard);
    }

    function goToNext() {
        if (!hasNext || !navigationCards || !onNavigate) {
            return;
        }

        const nextCard = navigationCards[navigationIndex + 1];
        onNavigate(nextCard.id, nextCard);
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (!navigationCards?.length || !onNavigate || navigationIndex < 0) {
                return;
            }

            if (event.key === 'ArrowLeft' && navigationIndex > 0) {
                const previousCard = navigationCards[navigationIndex - 1];
                onNavigate(previousCard.id, previousCard);
                return;
            }

            if (event.key === 'ArrowRight' && navigationIndex < navigationCards.length - 1) {
                const nextCard = navigationCards[navigationIndex + 1];
                onNavigate(nextCard.id, nextCard);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [onClose, navigationCards, navigationIndex, onNavigate]);

    const card = detail ?? preview;
    const imageUrl = card?.images?.large ?? card?.images?.small;
    const title = card?.name ?? 'Card details';
    const setSymbol = detail?.setSymbol ?? card?.setSymbol;
    const types = detail?.types ?? [];
    const subtypes = detail?.subtypes ?? [];
    const abilities = detail?.abilities ?? [];
    const attacks = detail?.attacks ?? [];
    const weaknesses = detail?.weaknesses ?? [];
    const resistances = detail?.resistances ?? [];
    const retreatCost = detail?.retreatCost ?? [];
    const evolvesTo = detail?.evolvesTo ?? [];

    const setLabel = detail?.setName
        ? detail.setSeries
            ? `${detail.setName} (${detail.setSeries})`
            : detail.setName
        : null;

    const numberLabel = detail?.number
        ? `#${detail.number}`
        : card?.number
          ? `#${card.number}`
          : null;

    const hasTypeInfo = types.length > 0 || Boolean(detail?.supertype);
    const subtypeLabel = subtypes.length > 0 ? subtypes.join(', ') : null;
    const evolvesToLabel = evolvesTo.length > 0 ? evolvesTo.join(', ') : null;
    const releaseDateLabel = detail?.setReleaseDate
        ? formatReleaseDate(detail.setReleaseDate)
        : null;

    const marketPrice = detail?.marketPrice ?? card?.marketPrice;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            role="presentation"
        >
            <button
                type="button"
                aria-label="Close card details"
                className="card-detail-backdrop absolute inset-0 bg-black/10 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="relative z-10 flex w-full max-w-[calc(64rem+6rem)] items-center justify-center gap-2 px-1 sm:gap-3 sm:px-0">
                {navigationCards && navigationCards.length > 1 ? (
                    <button
                        type="button"
                        aria-label="Previous card"
                        onClick={goToPrevious}
                        disabled={!hasPrevious}
                        className={`${NAV_BUTTON_CLASS} hidden sm:flex`}
                    >
                        <IoIosArrowBack className="h-5 w-5" aria-hidden="true" />
                    </button>
                ) : null}

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="card-detail-title"
                    className="card-detail-dialog relative flex max-h-[90vh] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
                >
                    {navigationCards && navigationCards.length > 1 ? (
                        <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-2 sm:hidden">
                            <button
                                type="button"
                                aria-label="Previous card"
                                onClick={goToPrevious}
                                disabled={!hasPrevious}
                                className={NAV_BUTTON_CLASS}
                            >
                                <IoIosArrowBack className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label="Next card"
                                onClick={goToNext}
                                disabled={!hasNext}
                                className={NAV_BUTTON_CLASS}
                            >
                                <IoIosArrowForward className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    ) : null}

                    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                        <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h2
                                    id="card-detail-title"
                                    className="min-w-0 truncate text-lg font-semibold"
                                >
                                    {title}
                                </h2>
                                {marketPrice != null ? (
                                    <span className="ui-pill shrink-0">
                                        {formatPrice(marketPrice)}
                                    </span>
                                ) : null}
                            </div>
                            {loading && !detail && <LoadingSpinner label="Loading details…" />}
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

                        <div className="grid gap-6 sm:grid-cols-[minmax(0,17.5rem)_1fr]">
                            <div className="mx-auto w-full max-w-[17.5rem] space-y-4 sm:mx-0">
                                {imageUrl ? (
                                    <CardTilt className="card-tilt-clip w-full max-w-full">
                                        <div
                                            className="card-tile-shine card-tile-shine-tilt card-tile-shine-masked block w-full max-w-full"
                                            style={
                                                {
                                                    '--shine-mask': `url("${imageUrl}")`,
                                                } as CSSProperties
                                            }
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imageUrl}
                                                alt={title}
                                                crossOrigin="anonymous"
                                                className="block w-full object-contain"
                                            />
                                        </div>
                                    </CardTilt>
                                ) : (
                                    <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-[var(--background)] text-sm text-[var(--muted)]">
                                        No image
                                    </div>
                                )}

                                {detail?.flavorText && (
                                    <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-sm italic text-[var(--muted)]">
                                        {detail.flavorText}
                                    </blockquote>
                                )}
                            </div>

                            <div className="space-y-4">
                                {loading && !detail ? (
                                    <DetailSkeleton />
                                ) : (
                                    <>
                                        {(setLabel ||
                                            numberLabel ||
                                            detail?.rarity ||
                                            releaseDateLabel ||
                                            hasTypeInfo ||
                                            subtypeLabel ||
                                            detail?.hp ||
                                            weaknesses.length > 0 ||
                                            resistances.length > 0 ||
                                            retreatCost.length > 0 ||
                                            detail?.evolvesFrom ||
                                            evolvesToLabel ||
                                            detail) && (
                                            <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                                                {setLabel && (
                                                    <DetailField label="Set">
                                                        <div className="flex items-center gap-2">
                                                            {setSymbol && (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={setSymbol}
                                                                    alt=""
                                                                    className="h-4 w-auto max-w-[1.25rem] shrink-0 object-contain"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <span>{setLabel}</span>
                                                        </div>
                                                    </DetailField>
                                                )}
                                                {numberLabel && (
                                                    <DetailField label="Number">
                                                        {numberLabel}
                                                    </DetailField>
                                                )}
                                                {detail && (
                                                    <DetailField label="Rarity">
                                                        <span className="inline-flex items-center gap-2">
                                                            {detail.rarity && (
                                                                <RaritySymbol
                                                                    rarity={detail.rarity}
                                                                    setSymbol={setSymbol}
                                                                />
                                                            )}
                                                            <span>{detail.rarity ?? ''}</span>
                                                        </span>
                                                    </DetailField>
                                                )}
                                                {releaseDateLabel && (
                                                    <DetailField label="Released">
                                                        {releaseDateLabel}
                                                    </DetailField>
                                                )}
                                                {hasTypeInfo && (
                                                    <DetailField label="Type">
                                                        <TypeValue
                                                            types={types}
                                                            supertype={detail?.supertype}
                                                        />
                                                    </DetailField>
                                                )}
                                                {subtypeLabel && (
                                                    <DetailField label="Subtype">
                                                        {subtypeLabel}
                                                    </DetailField>
                                                )}
                                                {detail?.hp && (
                                                    <DetailField label="HP">
                                                        {detail.hp}
                                                    </DetailField>
                                                )}
                                                {weaknesses.length > 0 && (
                                                    <DetailField label="Weakness">
                                                        <TypeModifierList modifiers={weaknesses} />
                                                    </DetailField>
                                                )}
                                                {resistances.length > 0 && (
                                                    <DetailField label="Resistance">
                                                        <TypeModifierList modifiers={resistances} />
                                                    </DetailField>
                                                )}
                                                {retreatCost.length > 0 && (
                                                    <DetailField label="Retreat">
                                                        <AttackCostIcons cost={retreatCost} />
                                                    </DetailField>
                                                )}
                                                {detail?.evolvesFrom && (
                                                    <DetailField label="Evolves from">
                                                        {detail.evolvesFrom}
                                                    </DetailField>
                                                )}
                                                {evolvesToLabel && (
                                                    <DetailField label="Evolves to">
                                                        {evolvesToLabel}
                                                    </DetailField>
                                                )}
                                                {detail && (
                                                    <DetailField label="Illustrator">
                                                        {detail.artist ?? ''}
                                                    </DetailField>
                                                )}
                                            </div>
                                        )}

                                        {abilities.length > 0 && (
                                            <div>
                                                <h3 className="mb-2 text-sm font-medium">
                                                    Ability
                                                </h3>
                                                <ul className="space-y-2">
                                                    {abilities.map((ability) => (
                                                        <li
                                                            key={ability.name}
                                                            className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
                                                        >
                                                            <p className="font-medium">
                                                                {ability.name}
                                                            </p>
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
                                                <h3 className="mb-2 text-sm font-medium">Moves</h3>
                                                <ul className="space-y-2">
                                                    {attacks.map((attack, index) => (
                                                        <li
                                                            key={`${attack.name}-${index}`}
                                                            className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
                                                        >
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="font-medium">
                                                                        {attack.name}
                                                                    </p>
                                                                    <AttackCostIcons
                                                                        cost={attack.cost}
                                                                    />
                                                                </div>
                                                                {attack.damage && (
                                                                    <div className="flex shrink-0 items-baseline gap-2">
                                                                        <span className="font-medium text-[var(--foreground)]">
                                                                            Damage
                                                                        </span>
                                                                        <span className="font-bold text-[var(--accent)]">
                                                                            {attack.damage}
                                                                        </span>
                                                                    </div>
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

                {navigationCards && navigationCards.length > 1 ? (
                    <button
                        type="button"
                        aria-label="Next card"
                        onClick={goToNext}
                        disabled={!hasNext}
                        className={`${NAV_BUTTON_CLASS} hidden sm:flex`}
                    >
                        <IoIosArrowForward className="h-5 w-5" aria-hidden="true" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
