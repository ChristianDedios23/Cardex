import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token is required' });
    }

    const token = authHeader.slice('Bearer '.length);

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('[auth]', error?.message ?? 'No user returned for token');
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = { id: user.id };
    next();
};
