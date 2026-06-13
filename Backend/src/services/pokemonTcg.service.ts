const POKEMON_TCG_BASE_URL = 'https://api.pokemontcg.io/v2';

function getPokemonTcgHeaders(): Record<string, string> {
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
