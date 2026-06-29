import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.slice('Bearer '.length);

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
        req.user = { id: user.id };
    }

    next();
};
