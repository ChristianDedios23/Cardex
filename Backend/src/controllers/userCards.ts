import { Request, Response } from 'express';
import {
    getPokemonCardById,
    PokemonTcgNotFoundError,
    PokemonTcgTimeoutError,
    PokemonTcgUpstreamError,
} from '../services/pokemonTcg.service';
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

function duplicateCardMessage(status: CardStatus): string {
    return status === 'owned'
        ? 'This card is already in your collection.'
        : 'This card is already on your wishlist.';
}

type ClientCardSnapshot = {
    cardName: string;
    cardImageUrl: string | null;
    marketPrice: number | null;
};

function parseClientCardSnapshot(body: {
    card_name?: unknown;
    card_image_url?: unknown;
    market_price?: unknown;
}): ClientCardSnapshot | null {
    if (typeof body.card_name !== 'string' || body.card_name.trim().length === 0) {
        return null;
    }

    let cardImageUrl: string | null = null;

    if (typeof body.card_image_url === 'string' && body.card_image_url.trim().length > 0) {
        cardImageUrl = body.card_image_url.trim();
    }

    let marketPrice: number | null = null;

    if (typeof body.market_price === 'number' && Number.isFinite(body.market_price)) {
        marketPrice = body.market_price;
    }

    return {
        cardName: body.card_name.trim(),
        cardImageUrl,
        marketPrice,
    };
}

function handlePokemonTcgError(error: unknown, res: Response) {
    if (error instanceof PokemonTcgNotFoundError) {
        return res.status(404).json({
            error: 'We could not find that card. Try searching again.',
        });
    }

    if (error instanceof PokemonTcgTimeoutError) {
        return res.status(504).json({
            error: 'Card lookup timed out. Please try again.',
        });
    }

    if (error instanceof PokemonTcgUpstreamError) {
        return res.status(502).json({
            error: 'Unable to look up card details right now. Please try again.',
        });
    }

    return res.status(500).json({
        error: error instanceof Error ? error.message : 'Something went wrong',
    });
}

export const createUserCard = async (req: Request, res: Response) => {
    try {
        const { external_card_id, status, quantity, condition, notes } = req.body;

        if (!external_card_id || typeof external_card_id !== 'string') {
            return res.status(400).json({ error: 'A card must be selected before saving.' });
        }

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Choose whether to add the card to your collection or wishlist.",
            });
        }

        if (condition && !allowedConditions.includes(condition)) {
            return res.status(400).json({ error: 'Please choose a valid card condition.' });
        }

        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Sign in to save cards.' });
        }

        const clientSnapshot = parseClientCardSnapshot(req.body);
        let cardName: string;
        let cardImageUrl: string | null;
        let marketPrice: number | null;

        if (clientSnapshot) {
            cardName = clientSnapshot.cardName;
            cardImageUrl = clientSnapshot.cardImageUrl;
            marketPrice = clientSnapshot.marketPrice;
        } else {
            const card = await getPokemonCardById(external_card_id);
            cardName = card.name;
            cardImageUrl = card.images?.large ?? card.images?.small ?? null;
            marketPrice = card.marketPrice;
        }

        const { data, error } = await insertUserCard({
            userId,
            externalCardId: external_card_id,
            status,
            quantity: status === 'owned' ? (quantity ?? 1) : null,
            condition: status === 'owned' ? (condition ?? null) : null,
            notes: notes ?? null,
            cardName,
            cardImageUrl,
            marketPrice,
        });

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: duplicateCardMessage(status) });
            }

            return res.status(500).json({
                error: 'Unable to save the card. Please try again.',
            });
        }

        return res.status(201).json(data);
    } catch (error) {
        return handlePokemonTcgError(error, res);
    }
};

export const getMyUserCards = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Sign in to view your cards.' });
        }

        const statusParam = req.query.status;
        let status: CardStatus | undefined;

        if (statusParam !== undefined) {
            if (
                typeof statusParam !== 'string' ||
                !allowedStatuses.includes(statusParam as CardStatus)
            ) {
                return res.status(400).json({
                    error: "Filter by collection or wishlist only.",
                });
            }
            status = statusParam as CardStatus;
        }

        const { data, error } = await findUserCards(userId, status);

        if (error) {
            return res.status(500).json({
                error: 'Unable to load your cards. Please try again.',
            });
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
            return res.status(401).json({ error: 'Sign in to update cards.' });
        }

        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Card not found.' });
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
                    error: "Choose whether the card belongs in your collection or wishlist.",
                });
            }
            updates.status = status;
        }

        if (quantity !== undefined) {
            updates.quantity = quantity;
        }

        if (condition !== undefined) {
            if (condition !== null && !allowedConditions.includes(condition)) {
                return res.status(400).json({ error: 'Please choose a valid card condition.' });
            }
            updates.condition = condition;
        }

        if (notes !== undefined) {
            updates.notes = notes;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No changes were provided.' });
        }

        const { data, error } = await updateUserCardById(userId, id, updates);

        if (error) {
            if (error.code === '23505' && updates.status) {
                return res.status(409).json({
                    error: duplicateCardMessage(updates.status),
                });
            }

            return res.status(500).json({
                error: 'Unable to update the card. Please try again.',
            });
        }

        if (!data) {
            return res.status(404).json({ error: 'Card not found in your list.' });
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
            return res.status(401).json({ error: 'Sign in to remove cards.' });
        }

        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Card not found.' });
        }

        const { data, error } = await deleteUserCardById(userId, id);

        if (error) {
            return res.status(500).json({
                error: 'Unable to remove the card. Please try again.',
            });
        }

        if (!data) {
            return res.status(404).json({ error: 'Card not found in your list.' });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
