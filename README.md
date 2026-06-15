# Cardex

A Pokémon TCG collection companion. Search cards, track what you own, build a wishlist, and see TCGPlayer market prices.

**Live app:** [https://cardex-companion.vercel.app/](https://cardex-companion.vercel.app/)

## What you can do

- Search Pokémon cards by name
- View TCGPlayer market prices (USD)
- Sign in and save cards to your collection or wishlist
- See a total value for your collection

Card data comes from the [Pokémon TCG API](https://dev.pokemontcg.io/). Your saved cards are stored in Supabase.

## API docs

When the backend is running locally, interactive docs are at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

The full spec is in [`Backend/openapi.yaml`](Backend/openapi.yaml).

## Run locally

**Requirements:** Node.js 20+, a Supabase project, and a Pokémon TCG API key.

**Backend**

```bash
cd Backend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

Runs at http://localhost:3000

**Frontend**

```bash
cd frontend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

Runs at http://localhost:3001

See each folder’s `.env.example` for the variables you need.
