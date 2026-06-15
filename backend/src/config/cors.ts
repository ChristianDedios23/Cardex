import cors from 'cors';

const DEFAULT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://cardex-companion.vercel.app',
];

function parseOrigins(raw: string | undefined): string[] {
    const source = raw?.trim() ? raw : DEFAULT_ORIGINS.join(',');
    return source
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);
}

export const allowedOrigins = parseOrigins(process.env.CORS_ORIGINS);

export const corsMiddleware = cors({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }

        const normalized = origin.replace(/\/$/, '');
        callback(null, allowedOrigins.includes(normalized));
    },
});
