'use client';

import { useEffect, useRef } from 'react';
import type { PokemonCardDetail, PokemonSeries, PokemonSetSummary } from '@/lib/api';
import { findSeriesBySlug } from '@/lib/seriesRoutes';

type ParsedSeriesPath = {
    seriesSlug: string | null;
    setId: string | null;
};

type UseSeriesRouteSyncParams = {
    tab: string;
    pathname: string;
    parsedSeriesPath: ParsedSeriesPath;
    seriesList: PokemonSeries[];
    seriesSetsLoading: boolean;
    setSelectedSeries: (series: PokemonSeries | null) => void;
    setSelectedSet: (set: PokemonSetSummary | null) => void;
    setSeriesSets: React.Dispatch<React.SetStateAction<PokemonSetSummary[]>>;
    seriesSetsCacheRef: React.MutableRefObject<Map<string, PokemonSetSummary[]>>;
    setSetCards: React.Dispatch<React.SetStateAction<PokemonCardDetail[]>>;
};

export function useSeriesRouteSync({
    tab,
    pathname,
    parsedSeriesPath,
    seriesList,
    seriesSetsLoading,
    setSelectedSeries,
    setSelectedSet,
    setSeriesSets,
    seriesSetsCacheRef,
    setSetCards,
}: UseSeriesRouteSyncParams) {
    const lastSyncedPathRef = useRef<string | null>(null);

    useEffect(() => {
        if (tab !== 'series') {
            lastSyncedPathRef.current = null;
            return;
        }

        const isNewPath = lastSyncedPathRef.current !== pathname;

        if (!isNewPath) {
            return;
        }

        const { seriesSlug, setId } = parsedSeriesPath;

        if (seriesSlug && seriesList.length === 0) {
            return;
        }

        lastSyncedPathRef.current = pathname;

        if (!seriesSlug) {
            setSelectedSeries(null);
            setSeriesSets((current) => (current.length > 0 ? [] : current));
            setSelectedSet(null);
            setSetCards((current) => (current.length > 0 ? [] : current));
            return;
        }

        const series = findSeriesBySlug(seriesList, seriesSlug);

        if (!series) {
            setSelectedSeries(null);
            setSeriesSets((current) => (current.length > 0 ? [] : current));
            setSelectedSet(null);
            setSetCards((current) => (current.length > 0 ? [] : current));
            return;
        }

        setSelectedSeries(series);

        if (!setId) {
            setSelectedSet(null);
            setSetCards((current) => (current.length > 0 ? [] : current));
            return;
        }

        const cachedSets = seriesSetsCacheRef.current.get(series.name) ?? [];
        const matchingSet = cachedSets.find((set) => set.id.toLowerCase() === setId);

        if (!matchingSet) {
            if (seriesSetsLoading || cachedSets.length === 0) {
                lastSyncedPathRef.current = null;
                return;
            }

            setSelectedSet(null);
            setSetCards((current) => (current.length > 0 ? [] : current));
            return;
        }

        setSelectedSet(matchingSet);
    }, [
        tab,
        pathname,
        parsedSeriesPath.seriesSlug,
        parsedSeriesPath.setId,
        seriesList,
        seriesSetsLoading,
        setSelectedSeries,
        setSelectedSet,
        setSeriesSets,
        setSetCards,
        seriesSetsCacheRef,
    ]);
}
