import { Request, Response } from 'express';
import {
    listPokemonSeries,
    listPokemonSetsBySeries,
    PokemonTcgTimeoutError,
    PokemonTcgUpstreamError,
} from '../services/pokemonTcg.service';

function handlePokemonTcgError(error: unknown, res: Response) {
    if (error instanceof PokemonTcgTimeoutError) {
        return res.status(504).json({ error: error.message });
    }

    if (error instanceof PokemonTcgUpstreamError) {
        return res.status(502).json({ error: error.message });
    }

    return res.status(500).json({
        error: error instanceof Error ? error.message : 'Something went wrong',
    });
}

export const getSeries = async (_req: Request, res: Response) => {
    try {
        const data = await listPokemonSeries();
        return res.json({ data });
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};

export const getSeriesSets = async (req: Request, res: Response) => {
    try {
        const { seriesName } = req.params;

        if (!seriesName || typeof seriesName !== 'string') {
            return res.status(400).json({ error: 'Series name is required' });
        }

        const data = await listPokemonSetsBySeries(decodeURIComponent(seriesName));
        return res.json({ data });
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};
