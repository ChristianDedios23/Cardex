import { NextFunction, Request, Response } from 'express';

export const BULK_OPERATION_COOLDOWN_MS = 5_000;

const lastBulkOperationByUser = new Map<string, number>();

export function bulkOperationLimiter(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;

    if (!userId) {
        next();
        return;
    }

    const now = Date.now();
    const lastOperationAt = lastBulkOperationByUser.get(userId) ?? 0;
    const elapsed = now - lastOperationAt;

    if (elapsed < BULK_OPERATION_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((BULK_OPERATION_COOLDOWN_MS - elapsed) / 1000);

        res.setHeader('Retry-After', String(retryAfterSeconds));
        res.status(429).json({
            error: `Please wait ${retryAfterSeconds}s before running another bulk action.`,
        });
        return;
    }

    lastBulkOperationByUser.set(userId, now);
    next();
}
