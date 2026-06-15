import { supabase } from '../config/supabase';

export type CardStatus = 'owned' | 'wishlist';

export type CardCondition =
    | 'mint'
    | 'near_mint'
    | 'lightly_played'
    | 'moderately_played'
    | 'heavily_played'
    | 'damaged';

export type CreateUserCardInput = {
    userId: string;
    externalCardId: string;
    status: CardStatus;
    quantity: number | null;
    condition: CardCondition | null;
    notes: string | null;
    cardName: string;
    cardImageUrl: string | null;
    marketPrice: number | null;
};

export type UpdateUserCardInput = {
    status?: CardStatus;
    quantity?: number;
    condition?: CardCondition | null;
    notes?: string | null;
};

export async function insertUserCard(input: CreateUserCardInput) {
    return supabase
        .from('user_cards')
        .insert({
            user_id: input.userId,
            external_card_id: input.externalCardId,
            status: input.status,
            quantity: input.quantity,
            condition: input.condition,
            notes: input.notes,
            card_name: input.cardName,
            card_image_url: input.cardImageUrl,
            market_price: input.marketPrice,
        })
        .select()
        .single();
}

export async function findUserCards(userId: string, status?: CardStatus) {
    let query = supabase
        .from('user_cards')
        .select()
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    return query;
}

export async function updateUserCardById(
    userId: string,
    cardId: string,
    updates: UpdateUserCardInput,
) {
    return supabase
        .from('user_cards')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', cardId)
        .eq('user_id', userId)
        .select()
        .single();
}

export async function deleteUserCardById(userId: string, cardId: string) {
    return supabase
        .from('user_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', userId)
        .select()
        .single();
}
