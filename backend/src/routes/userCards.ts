import { Router } from 'express';
import {
    createUserCard,
    deleteUserCard,
    getMyUserCards,
    updateUserCard,
} from '../controllers/userCards';
import { requireAuth } from '../middleware/requireAuth';

const userCardsRouter = Router();

userCardsRouter.use(requireAuth);

userCardsRouter.post('/', createUserCard);
userCardsRouter.get('/me', getMyUserCards);
userCardsRouter.patch('/:id', updateUserCard);
userCardsRouter.delete('/:id', deleteUserCard);

export { userCardsRouter };
