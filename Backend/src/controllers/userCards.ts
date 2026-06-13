import { Request, Response } from 'express';
import { getPokemonCardById } from '../services/pokemonTcg.service';
import {
    deleteUserCardById,
    findUserCards,
    insertUserCard,
    updateUserCardById,
    type CardCondition,
    type CardStatus,
} from '../services/userCards.service';

const allowedStatuses: CardStatus[] = ['owned', 'wishlist'];
const allowedConditions: CardCondition[] = [
    'mint',
    'near_mint',
    'lightly_played',
    'moderately_played',
    'heavily_played',
    'damaged',
];

function getAuthenticatedUserId(req: Request): string | undefined {
    return req.user?.id;
}

export const createUserCard = async (req: Request, res: Response) => {
    try {
        const { external_card_id, status, quantity, condition, notes } = req.body;

        if (!external_card_id || typeof external_card_id !== 'string') {
            return res.status(400).json({ error: 'external_card_id is required' });
        }

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "status must be either 'owned' or 'wishlist'",
            });
        }

        if (condition && !allowedConditions.includes(condition)) {
            return res.status(400).json({ error: 'Invalid card condition' });
        }

        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication is required' });
        }

        const card = await getPokemonCardById(external_card_id);
        const cardImageUrl = card.images?.large ?? card.images?.small ?? null;

        const { data, error } = await insertUserCard({
            userId,
            externalCardId: external_card_id,
            status,
            quantity: status === 'owned' ? (quantity ?? 1) : null,
            condition: status === 'owned' ? (condition ?? null) : null,
            notes: notes ?? null,
            cardName: card.name,
            cardImageUrl,
        });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};

export const getMyUserCards = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication is required' });
        }

        const statusParam = req.query.status;
        let status: CardStatus | undefined;

        if (statusParam !== undefined) {
            if (
                typeof statusParam !== 'string' ||
                !allowedStatuses.includes(statusParam as CardStatus)
            ) {
                return res.status(400).json({
                    error: "status must be either 'owned' or 'wishlist'",
                });
            }
            status = statusParam as CardStatus;
        }

        const { data, error } = await findUserCards(userId, status);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};

export const updateUserCard = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication is required' });
        }

        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'User card ID is required' });
        }

        const { status, quantity, condition, notes } = req.body;
        const updates: {
            status?: CardStatus;
            quantity?: number;
            condition?: CardCondition | null;
            notes?: string | null;
        } = {};

        if (status !== undefined) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    error: "status must be either 'owned' or 'wishlist'",
                });
            }
            updates.status = status;
        }

        if (quantity !== undefined) {
            updates.quantity = quantity;
        }

        if (condition !== undefined) {
            if (condition !== null && !allowedConditions.includes(condition)) {
                return res.status(400).json({ error: 'Invalid card condition' });
            }
            updates.condition = condition;
        }

        if (notes !== undefined) {
            updates.notes = notes;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await updateUserCardById(userId, id, updates);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'User card not found' });
        }

        return res.json(data);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};

export const deleteUserCard = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'User authentication is required' });
        }

        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'User card ID is required' });
        }

        const { data, error } = await deleteUserCardById(userId, id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'User card not found' });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
