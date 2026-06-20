import { Request, Response } from 'express';
import {
    listPokemonCardsBySet,
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

export const getSetCards = async (req: Request, res: Response) => {
    try {
        const { setId } = req.params;

        if (!setId || typeof setId !== 'string') {
            return res.status(400).json({ error: 'Set ID is required' });
        }

        const data = await listPokemonCardsBySet(decodeURIComponent(setId));
        return res.json({ data, totalCount: data.length });
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};
