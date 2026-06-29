import type { PokemonSetSummary } from '@/lib/api';
import { formatSeriesReleaseDate } from '@/components/app/card-utils';

export function SetTile({ set, onSelect }: { set: PokemonSetSummary; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="series-tile-glow w-full rounded-xl text-center shadow-[0_10px_28px_rgb(0_0_0_/_0.35)] transition-shadow hover:shadow-[0_14px_32px_rgb(0_0_0_/_0.42)]"
        >
            <div className="relative z-[1] flex flex-col items-center px-3 py-4">
                <div className="mb-3 flex h-20 w-full items-center justify-center">
                    {set.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={set.logo}
                            alt=""
                            className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                        />
                    ) : set.symbol ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={set.symbol}
                            alt=""
                            className="h-10 w-10 object-contain drop-shadow-md"
                        />
                    ) : (
                        <span className="text-xs text-[var(--muted)]">No logo</span>
                    )}
                </div>
                <p className="text-sm font-medium leading-snug">{set.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatSeriesReleaseDate(set.releaseDate)}
                </p>
                {set.total != null && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{set.total} cards</p>
                )}
            </div>
        </button>
    );
}
