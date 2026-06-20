import { Router } from 'express';
import { getSetCards } from '../controllers/sets';

const setsRouter = Router();

setsRouter.get('/:setId/cards', getSetCards);

export { setsRouter };
