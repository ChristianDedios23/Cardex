import { Router } from 'express';
import { getCardById, searchCards } from '../controllers/cards';

const cardsRouter = Router();

cardsRouter.get('/search', searchCards);
cardsRouter.get('/:id', getCardById);

export { cardsRouter };
