import { Request, Response } from 'express';
import { getPokemonCardById, searchPokemonCards } from '../services/pokemonTcg.service';

export const searchCards = async (req: Request, res: Response) => {
    try {
        const query = req.query.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const cards = await searchPokemonCards(query);
        return res.json(cards);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
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
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
