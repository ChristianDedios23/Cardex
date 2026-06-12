import { Request, Response } from 'express';

export const heartbeat = (req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is running' });
};
