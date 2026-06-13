# Cardex Current Supabase Database Schema

This document describes the current MVP database schema for the Cardex backend using Supabase.

## Overview

Cardex uses Supabase for authentication and database storage. Card data itself comes from the external Pokémon TCG API. The database only stores user-specific saved card data, such as whether a card is owned or wishlisted.

The main table is:

```txt
user_cards
```

This table stores cards that a signed-in user has saved to their account.

## Relationship to Supabase Auth

Supabase automatically manages authenticated users in:

```sql
auth.users
```

The `user_cards.user_id` column references `auth.users(id)`, which means each saved card belongs to a real Supabase Auth user.

If a user is deleted, their saved cards are deleted automatically because of `on delete cascade`.

## Current Schema

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

## Column Descriptions

| Column             |                       Type | Description                                                          |
| ------------------ | -------------------------: | -------------------------------------------------------------------- |
| `id`               |                     `uuid` | Primary key for each saved card row.                                 |
| `user_id`          |                     `uuid` | References the signed-in Supabase user from `auth.users(id)`.        |
| `external_card_id` |                     `text` | The card ID from the Pokémon TCG API, such as `swsh11-131`.          |
| `status`           |                     `text` | Whether the card is `owned` or `wishlist`.                           |
| `quantity`         |                      `int` | Number of copies the user owns. Mainly used when `status = 'owned'`. |
| `condition`        |                     `text` | Condition of the card. Mainly used when `status = 'owned'`.          |
| `notes`            |                     `text` | Optional user notes about the card.                                  |
| `card_name`        |                     `text` | Cached card name from the Pokémon TCG API for faster display.        |
| `card_image_url`   |                     `text` | Cached card image URL from the Pokémon TCG API for faster display.   |
| `created_at`       | `timestamp with time zone` | When the row was created.                                            |
| `updated_at`       | `timestamp with time zone` | When the row was last updated.                                       |

## Allowed Status Values

```txt
owned
wishlist
```

## Allowed Condition Values

The database stores condition values in lowercase snake_case format:

```txt
mint
near_mint
lightly_played
moderately_played
heavily_played
damaged
```

The frontend can display these as:

```txt
Mint
Near Mint
Lightly Played
Moderately Played
Heavily Played
Damaged
```

## Example Owned Card Row

```json
{
    "id": "generated-uuid",
    "user_id": "supabase-user-id",
    "external_card_id": "swsh11-131",
    "status": "owned",
    "quantity": 1,
    "condition": "near_mint",
    "notes": "Pulled from pack",
    "card_name": "Giratina VSTAR",
    "card_image_url": "https://images.pokemontcg.io/..."
}
```

## Example Wishlist Card Row

```json
{
    "id": "generated-uuid",
    "user_id": "supabase-user-id",
    "external_card_id": "swsh11-131",
    "status": "wishlist",
    "quantity": null,
    "condition": null,
    "notes": "Want this card later",
    "card_name": "Giratina VSTAR",
    "card_image_url": "https://images.pokemontcg.io/..."
}
```

## Important Design Decision

Cardex does not store full Pokémon card details in Supabase.

The Pokémon TCG API is the source of truth for card data. Supabase only stores:

- Which cards a user saved
- Whether the card is owned or wishlisted
- User-specific collection details
- Small cached display fields, such as name and image

This keeps the database simple and avoids duplicating the external card API.

## Current Backend Route Expectations

The backend should use this table for routes like:

```txt
POST   /user-cards
GET    /user-cards/me
GET    /user-cards/me?status=owned
GET    /user-cards/me?status=wishlist
PATCH  /user-cards/:id
DELETE /user-cards/:id
```

Searching and viewing card details should use the Pokémon TCG API routes instead:

```txt
GET /cards/search?query=giratina
GET /cards/:id
```

## Notes for Cursor

Follow the current backend structure and naming conventions already used in the project.

Expected backend organization:

```txt
src/
  config/
    supabase.ts
  routes/
    cards.routes.ts
    userCards.routes.ts
  services/
    pokemonTcg.service.ts
    userCards.service.ts
  middleware/
    requireAuth.ts
  app.ts
  server.ts
```

Do not create separate `collection_items` and `wishlist_items` tables for the MVP. Use the single `user_cards` table with the `status` column.

Do not store card prices for now.

Do not store the full Pokémon TCG API response in Supabase.
