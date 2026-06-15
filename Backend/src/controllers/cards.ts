import { Request, Response } from 'express';
import {
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    getPokemonCardById,
    MAX_PAGE_SIZE,
    MIN_QUERY_LENGTH,
    PokemonTcgNotFoundError,
    PokemonTcgTimeoutError,
    PokemonTcgUpstreamError,
    searchPokemonCards,
} from '../services/pokemonTcg.service';

function handlePokemonTcgError(error: unknown, res: Response) {
    if (error instanceof PokemonTcgNotFoundError) {
        return res.status(404).json({ error: error.message });
    }

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

function parsePositiveInt(value: unknown): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return undefined;
    }

    return parsed;
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

        const pageParam = parsePositiveInt(req.query.page);
        const pageSizeParam = parsePositiveInt(req.query.pageSize);

        if (req.query.page !== undefined && pageParam === undefined) {
            return res.status(400).json({ error: 'page must be a positive integer' });
        }

        if (req.query.pageSize !== undefined && pageSizeParam === undefined) {
            return res.status(400).json({ error: 'pageSize must be a positive integer' });
        }

        const page = pageParam ?? DEFAULT_PAGE;
        const pageSize = Math.min(pageSizeParam ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

        const result = await searchPokemonCards(trimmed, page, pageSize);
        return res.json(result);
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
