import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '../public/data/pokedex-species.json');

const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
const payload = await response.json();

if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`);
}

const species = payload.results
    .map((entry) => {
        const id = Number(entry.url.replace(/\/$/, '').split('/').pop());

        return {
            id,
            name: entry.name,
        };
    })
    .filter((entry) => Number.isFinite(entry.id) && entry.id >= 1 && entry.id <= 1025)
    .sort((left, right) => left.id - right.id);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ species }, null, 2)}\n`, 'utf8');

console.log(`Wrote ${species.length} species to ${outputPath}`);
