import { Request, Response } from 'express';
import {
    getPokemonCardById,
    MIN_QUERY_LENGTH,
    PokemonTcgTimeoutError,
    PokemonTcgUpstreamError,
    searchPokemonCards,
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

export const searchCards = async (req: Request, res: Response) => {
    try {
        const query = req.query.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const trimmed = query.trim();

        if (trimmed.length < MIN_QUERY_LENGTH) {
            return res.status(400).json({
                error: 'Search query must be at least 3 characters',
            });
        }

        const cards = await searchPokemonCards(trimmed);
        return res.json(cards);
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};

export const getCardById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Card ID is required' });
        }

        const card = await getPokemonCardById(id);
        return res.json(card);
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};
