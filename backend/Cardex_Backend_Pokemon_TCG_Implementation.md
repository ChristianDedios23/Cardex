# Cardex Backend: Pokémon TCG API + Supabase User Cards

## Goal

Cardex will use the **Pokémon TCG API** as the source of truth for Pokémon card data. The backend should not store full card information. Instead, the backend should use the Pokémon TCG API to search and retrieve cards, then store only the user's saved card information in Supabase when the user adds a card to their collection or wishlist.

The backend should follow the existing project format:

```txt
backend/
  src/
    config/
    middleware/
    routes/
    services/
    app.ts
    server.ts
```

Use the same coding style already used in the backend: separate route files, service files, Supabase config, and Express route mounting in `app.ts`.

---

## External API

We are using the Pokémon TCG API:

```txt
https://api.pokemontcg.io/v2/cards
```

Main endpoints we need:

```txt
GET https://api.pokemontcg.io/v2/cards
GET https://api.pokemontcg.io/v2/cards/{id}
```

Example card search:

```txt
GET https://api.pokemontcg.io/v2/cards?q=name:giratina
```

Example card by ID:

```txt
GET https://api.pokemontcg.io/v2/cards/swsh11-131
```

The backend should call this API through a service file. Do not call the Pokémon TCG API directly from route handlers unless absolutely necessary.

---

## Environment Variables

Add this to the backend `.env` file:

```env
POKEMON_TCG_API_KEY=your_api_key_here
```

The API can work without a key, but using a key gives better rate limits. The backend should support both cases:

- If `POKEMON_TCG_API_KEY` exists, send it in the `X-Api-Key` header.
- If it does not exist, still make the request without the header.

---

## Supabase Table

Use one table for both owned cards and wishlist cards. The `status` column tells whether the card is owned or wishlisted.

```sql
create table user_cards (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  external_card_id text not null,

  status text not null check (status in ('owned', 'wishlist')),

  quantity int,
  condition text check (
    condition is null or condition in (
      'mint',
      'near_mint',
      'lightly_played',
      'moderately_played',
      'heavily_played',
      'damaged'
    )
  ),
  notes text,

  card_name text,
  card_image_url text,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(user_id, external_card_id, status)
);
```

### Why `external_card_id` is text

Pokémon TCG API card IDs are strings like:

```txt
swsh11-131
```

So `external_card_id` should be `text`, not `int`.

### Why we store `card_name` and `card_image_url`

The Pokémon TCG API has the full card data, but saving the card name and image URL makes the user's collection page faster and easier to display.

We are not storing full card info such as attacks, HP, rarity, set data, prices, artist, or rules.

---

## Backend MVP Routes

Implement these routes first:

```txt
GET    /v1/heartbeat
GET    /v1/cards/search?query=giratina
GET    /v1/cards/:id
POST   /v1/user-cards
GET    /v1/user-cards/me
PATCH  /v1/user-cards/:id
DELETE /v1/user-cards/:id
```

---

## Route Behavior

### `GET /v1/cards/search?query=giratina`

Searches for cards using the Pokémon TCG API.

Backend flow:

```txt
1. Read query from req.query.query
2. Validate that query exists
3. Call pokemonTcg.service.ts
4. Return the cards from the external API
```

This route does **not** insert anything into Supabase.

---

### `GET /v1/cards/:id`

Gets one card from the Pokémon TCG API by ID.

Example:

```txt
GET /v1/cards/swsh11-131
```

Backend flow:

```txt
1. Read card ID from req.params.id
2. Call pokemonTcg.service.ts
3. Return the card details from the external API
```

This route does **not** insert anything into Supabase.

---

### `POST /v1/user-cards`

Adds a card to the signed-in user's collection or wishlist.

Request body example for owned card:

```json
{
    "external_card_id": "swsh11-131",
    "status": "owned",
    "quantity": 1,
    "condition": "near_mint",
    "notes": "Pulled from a pack",
    "card_name": "Giratina V",
    "card_image_url": "https://images.pokemontcg.io/swsh11/131_hires.png",
    "market_price": 12.5
}
```

Request body example for wishlist card:

```json
{
    "external_card_id": "swsh11-131",
    "status": "wishlist",
    "notes": "Want this card later",
    "card_name": "Giratina V",
    "card_image_url": "https://images.pokemontcg.io/swsh11/131_hires.png",
    "market_price": 12.5
}
```

When `card_name` is included (e.g. from search results), skip the upstream Pokémon TCG lookup and store the snapshot directly. If omitted, fetch the card by ID upstream first.

Backend flow:

```txt
1. Verify the user is authenticated.
2. Validate external_card_id.
3. Validate status is either owned or wishlist.
4. Validate condition if provided.
5. Use client snapshot when `card_name` is provided; otherwise call the Pokémon TCG API.
6. Insert into Supabase user_cards table.
7. Return the inserted row.
```

Important: cards should only be inserted into Supabase when the user chooses to add the card to their collection or wishlist. Do not insert cards just because they were displayed or searched.

---

## Service File

Create:

```txt
src/services/pokemonTcg.service.ts
```

Suggested implementation:

```ts
const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';

function getPokemonTcgHeaders() {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (process.env.POKEMON_TCG_API_KEY) {
        headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
    }

    return headers;
}

export async function searchPokemonCards(query: string) {
    const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);

    url.searchParams.set('q', `name:${query}`);
    url.searchParams.set('pageSize', '20');

    const response = await fetch(url, {
        headers: getPokemonTcgHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to search Pokémon cards');
    }

    const data = await response.json();
    return data.data;
}

export async function getPokemonCardById(cardId: string) {
    const response = await fetch(`${POKEMON_TCG_BASE_URL}/cards/${cardId}`, {
        headers: getPokemonTcgHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Pokémon card');
    }

    const data = await response.json();
    return data.data;
}
```

---

## Cards Routes

Create:

```txt
src/routes/cards.ts
```

Suggested implementation:

```ts
import { Router } from 'express';
import { getPokemonCardById, searchPokemonCards } from '../services/pokemonTcg.service';

const cardsRouter = Router();

cardsRouter.get('/search', async (req, res) => {
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
});

cardsRouter.get('/:id', async (req, res) => {
    try {
        const card = await getPokemonCardById(req.params.id);
        return res.json(card);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
});

export { cardsRouter };
```

---

## User Cards Routes

Create:

```txt
src/routes/userCards.ts
```

Suggested implementation:

```ts
import { Router } from 'express';
import { supabase } from '../config/supabase';
import { getPokemonCardById } from '../services/pokemonTcg.service';

const userCardsRouter = Router();

const allowedStatuses = ['owned', 'wishlist'];
const allowedConditions = [
    'mint',
    'near_mint',
    'lightly_played',
    'moderately_played',
    'heavily_played',
    'damaged',
];

userCardsRouter.post('/', async (req, res) => {
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

        // Replace this with the authenticated user ID from auth middleware.
        // Example later: const userId = req.user.id;
        const userId = req.body.user_id;

        if (!userId) {
            return res.status(401).json({ error: 'User authentication is required' });
        }

        const card = await getPokemonCardById(external_card_id);
        const cardImageUrl = card.images?.large ?? card.images?.small ?? null;

        const { data, error } = await supabase
            .from('user_cards')
            .insert({
                user_id: userId,
                external_card_id,
                status,
                quantity: status === 'owned' ? (quantity ?? 1) : null,
                condition: status === 'owned' ? (condition ?? null) : null,
                notes: notes ?? null,
                card_name: card.name,
                card_image_url: cardImageUrl,
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
});

export { userCardsRouter };
```

Note: the temporary `req.body.user_id` should be replaced once Supabase Auth middleware is implemented. In production, never trust the frontend to send `user_id`. The backend should get the user ID from the verified Supabase access token.

---

## Mount Routes in `app.ts`

Update `src/app.ts`:

```ts
import express from 'express';
import cors from 'cors';
import { router } from './routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.use(router);
```

Routes are mounted under `/v1` in `src/routes/index.ts`:

```ts
import { Router } from 'express';
import { cardsRouter } from './cards';
import { heartbeatRouter } from './heartbeat';
import { userCardsRouter } from './userCards';

const router = Router();

const v1Router = Router();
v1Router.use('/heartbeat', heartbeatRouter);
v1Router.use('/cards', cardsRouter);
v1Router.use('/user-cards', userCardsRouter);

router.use('/v1', v1Router);

export { router };
```

---

## Implementation Notes for Cursor

When implementing this feature, follow the existing backend structure and do not place all logic directly inside `app.ts`.

Use this separation:

```txt
routes/    -> request and response handling
services/  -> external API logic and reusable business logic
config/    -> Supabase client setup
middleware/ -> auth middleware later
```

Do not install `pokemontcgsdk`. Use direct `fetch` calls instead because the SDK can bring outdated dependencies and security warnings.

Do not store prices for now.

Do not store full card data for now.

Only store:

```txt
external_card_id
status
quantity
condition
notes
card_name
card_image_url
```

---

## Current MVP Summary

The backend MVP is:

```txt
1. Search Pokémon cards through our backend.
2. View Pokémon card details through our backend.
3. Add a card to the signed-in user's owned collection or wishlist.
4. Store only a small card snapshot in Supabase.
5. Keep the Pokémon TCG API as the source of truth for full card details.
```
