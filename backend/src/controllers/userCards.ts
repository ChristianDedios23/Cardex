import { Request, Response } from 'express';
import {
    getPokemonCardById,
    PokemonTcgNotFoundError,
    PokemonTcgTimeoutError,
    PokemonTcgUpstreamError,
} from '../services/pokemonTcg.service';
import {
    deleteOwnedUserCardsByExternalIds,
    deleteUserCardById,
    findOwnedExternalCardIds,
    findUserCards,
    insertUserCard,
    insertUserCardsBulk,
    updateUserCardById,
    type CardCondition,
    type CardStatus,
} from '../services/userCards.service';

const BULK_OWNED_MAX_CARDS = 300;

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
                error: 'Choose whether to add the card to your collection or wishlist.',
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
                    error: 'Filter by collection or wishlist only.',
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
                    error: 'Choose whether the card belongs in your collection or wishlist.',
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

type BulkOwnedCardInput = {
    externalCardId: string;
    cardName: string;
    cardImageUrl: string | null;
    marketPrice: number | null;
};

function parseBulkOwnedCardInput(raw: unknown): BulkOwnedCardInput | null {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const card = raw as {
        external_card_id?: unknown;
        card_name?: unknown;
        card_image_url?: unknown;
        market_price?: unknown;
    };

    if (typeof card.external_card_id !== 'string' || card.external_card_id.trim().length === 0) {
        return null;
    }

    const snapshot = parseClientCardSnapshot(card);

    if (!snapshot) {
        return null;
    }

    return {
        externalCardId: card.external_card_id.trim(),
        cardName: snapshot.cardName,
        cardImageUrl: snapshot.cardImageUrl,
        marketPrice: snapshot.marketPrice,
    };
}

function parseBulkOwnedCards(body: { cards?: unknown }): BulkOwnedCardInput[] | null {
    if (!Array.isArray(body.cards) || body.cards.length === 0) {
        return null;
    }

    if (body.cards.length > BULK_OWNED_MAX_CARDS) {
        return null;
    }

    const parsed: BulkOwnedCardInput[] = [];

    for (const rawCard of body.cards) {
        const card = parseBulkOwnedCardInput(rawCard);

        if (!card) {
            return null;
        }

        parsed.push(card);
    }

    return parsed;
}

export const bulkAddOwnedUserCards = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Sign in to save cards.' });
        }

        const parsedCards = parseBulkOwnedCards(req.body);

        if (!parsedCards) {
            return res.status(400).json({
                error: `Provide up to ${BULK_OWNED_MAX_CARDS} cards with names and IDs to add.`,
            });
        }

        const uniqueCards = [
            ...new Map(parsedCards.map((card) => [card.externalCardId, card])).values(),
        ];
        const externalCardIds = uniqueCards.map((card) => card.externalCardId);
        const { data: existingRows, error: existingError } = await findOwnedExternalCardIds(
            userId,
            externalCardIds,
        );

        if (existingError) {
            return res.status(500).json({
                error: 'Unable to check your collection. Please try again.',
            });
        }

        const ownedIds = new Set((existingRows ?? []).map((row) => row.external_card_id));
        const cardsToInsert = uniqueCards.filter((card) => !ownedIds.has(card.externalCardId));

        if (cardsToInsert.length === 0) {
            return res.status(200).json({
                added: [],
                skipped: uniqueCards.length,
                addedCount: 0,
            });
        }

        const { data, error } = await insertUserCardsBulk(
            cardsToInsert.map((card) => ({
                userId,
                externalCardId: card.externalCardId,
                status: 'owned',
                quantity: 1,
                condition: null,
                notes: null,
                cardName: card.cardName,
                cardImageUrl: card.cardImageUrl,
                marketPrice: card.marketPrice,
            })),
        );

        if (error) {
            return res.status(500).json({
                error: 'Unable to add cards to your collection. Please try again.',
            });
        }

        return res.status(201).json({
            added: data ?? [],
            skipped: uniqueCards.length - cardsToInsert.length,
            addedCount: data?.length ?? 0,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};

export const bulkRemoveOwnedUserCards = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({ error: 'Sign in to remove cards.' });
        }

        const { external_card_ids: externalCardIdsRaw } = req.body;

        if (!Array.isArray(externalCardIdsRaw) || externalCardIdsRaw.length === 0) {
            return res.status(400).json({
                error: 'Provide the card IDs to remove from your collection.',
            });
        }

        if (externalCardIdsRaw.length > BULK_OWNED_MAX_CARDS) {
            return res.status(400).json({
                error: `You can remove up to ${BULK_OWNED_MAX_CARDS} cards at once.`,
            });
        }

        const externalCardIds = [
            ...new Set(
                externalCardIdsRaw.filter(
                    (value): value is string =>
                        typeof value === 'string' && value.trim().length > 0,
                ),
            ),
        ];

        if (externalCardIds.length === 0) {
            return res.status(400).json({
                error: 'Provide the card IDs to remove from your collection.',
            });
        }

        const { data, error } = await deleteOwnedUserCardsByExternalIds(userId, externalCardIds);

        if (error) {
            return res.status(500).json({
                error: 'Unable to remove cards from your collection. Please try again.',
            });
        }

        return res.status(200).json({
            removed: data ?? [],
            removedCount: data?.length ?? 0,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
