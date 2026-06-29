import type { PokemonSeries } from '@/lib/api';

export function slugifySeriesName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function seriesMatchesSlug(seriesName: string, slug: string): boolean {
    return slugifySeriesName(seriesName) === slug.toLowerCase();
}

export function findSeriesBySlug(
    seriesList: PokemonSeries[],
    slug: string,
): PokemonSeries | undefined {
    return seriesList.find((series) => seriesMatchesSlug(series.name, slug));
}

export type ParsedSeriesPath = {
    seriesSlug: string | null;
    setId: string | null;
};

export function parseSeriesPathname(pathname: string): ParsedSeriesPath {
    if (!pathname.startsWith('/series')) {
        return { seriesSlug: null, setId: null };
    }

    const segments = pathname.slice('/series'.length).split('/').filter(Boolean);

    if (segments.length === 0) {
        return { seriesSlug: null, setId: null };
    }

    if (segments.length === 1) {
        return { seriesSlug: decodeURIComponent(segments[0]!), setId: null };
    }

    return {
        seriesSlug: decodeURIComponent(segments[0]!),
        setId: decodeURIComponent(segments[1]!).toLowerCase(),
    };
}

export function buildSeriesPath(): string {
    return '/series';
}

export function buildSeriesEraPath(seriesName: string): string {
    return `/series/${slugifySeriesName(seriesName)}`;
}

export function buildSetPath(seriesName: string, setId: string): string {
    return `/series/${slugifySeriesName(seriesName)}/${setId.toLowerCase()}`;
}
