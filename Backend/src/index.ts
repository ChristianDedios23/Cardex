import './types/express';
import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api-docs`);

    if (!process.env.POKEMON_TCG_API_KEY) {
        console.warn(
            'Warning: POKEMON_TCG_API_KEY is not set. Pokémon TCG API requests may be slower or rate-limited. Get a key at https://dev.pokemontcg.io',
        );
    }
});
