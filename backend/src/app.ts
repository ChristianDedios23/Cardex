import fs from 'fs';
import path from 'path';
import express, { Request, Response } from 'express';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';
import { corsMiddleware } from './config/cors';
import { logger } from './middleware/logger';
import { router } from './routes';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(logger);

// OpenAPI documentation (openapi.yaml lives at project root, not in dist/)
const specFile = fs.readFileSync(
    path.join(__dirname, '..', 'openapi.yaml'),
    'utf8',
);
const spec = YAML.parse(specFile);
app.get('/openapi.json', (_req: Request, res: Response) => {
    res.json(spec);
});
app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

app.use(router);

// 404 handler — must be after all routes
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

export { app };
