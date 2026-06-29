import type { PokemonSeries } from '@/lib/api';
import { formatSeriesReleaseDate } from '@/components/app/card-utils';

export function SeriesTile({ series, onSelect }: { series: PokemonSeries; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="series-tile-glow w-full rounded-xl text-center shadow-[0_10px_28px_rgb(0_0_0_/_0.35)] transition-shadow hover:shadow-[0_14px_32px_rgb(0_0_0_/_0.42)]"
        >
            <div className="relative z-[1] flex flex-col items-center px-3 py-4">
                <div className="mb-3 flex h-20 w-full items-center justify-center">
                    {series.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={series.logo}
                            alt=""
                            className="max-h-17.5 max-w-full object-contain drop-shadow-md"
                        />
                    ) : (
                        <span className="text-xs text-[var(--muted)]">No logo</span>
                    )}
                </div>
                <p className="text-sm font-medium leading-snug">{series.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatSeriesReleaseDate(series.releaseDate)}
                </p>
            </div>
        </button>
    );
}
