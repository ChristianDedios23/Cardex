# Cardex

A Pokémon TCG collection companion. Search cards, track what you own, build a wishlist, and see TCGPlayer market prices.

**Live app:** [https://cardex-companion.vercel.app/](https://cardex-companion.vercel.app/)  
**Live API:** [https://cardex-78ts.onrender.com](https://cardex-78ts.onrender.com) · [API docs](https://cardex-78ts.onrender.com/api-docs)

## What you can do

- Search Pokémon cards by name
- View TCGPlayer market prices (USD)
- Sign in and save cards to your collection or wishlist
- See a total value for your collection

Card data comes from the [Pokémon TCG API](https://dev.pokemontcg.io/). Your saved cards are stored in Supabase.

## Run locally

**Requirements:** Node.js 20+, a Supabase project, and a Pokémon TCG API key.

**Backend** — http://localhost:3000

```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

**Frontend** — http://localhost:3001

```bash
cd frontend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

Local API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs). OpenAPI spec: [`backend/openapi.yaml`](backend/openapi.yaml).

## Deployment

| Service | Host | Root directory | Build | Start |
|---------|------|----------------|-------|-------|
| Frontend | Vercel | `frontend` | default | default |
| Backend | Render | `backend` | `npm install && npm run build` | `npm start` |

**Frontend (Vercel):** set `NEXT_PUBLIC_API_URL=https://cardex-78ts.onrender.com` plus your Supabase vars.

**Backend (Render):** set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `POKEMON_TCG_API_KEY`. CORS allows `https://cardex-companion.vercel.app` and local dev origins by default (`CORS_ORIGINS` in `.env.example`).

See each folder’s `.env.example` for all variables.
