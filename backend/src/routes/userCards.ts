import { Router } from 'express';
import {
    bulkAddOwnedUserCards,
    bulkRemoveOwnedUserCards,
    createUserCard,
    deleteUserCard,
    getMyUserCards,
    updateUserCard,
} from '../controllers/userCards';
import { bulkOperationLimiter } from '../middleware/bulkOperationLimiter';
import { requireAuth } from '../middleware/requireAuth';

const userCardsRouter = Router();

userCardsRouter.use(requireAuth);

userCardsRouter.post('/bulk-owned', bulkOperationLimiter, bulkAddOwnedUserCards);
userCardsRouter.delete('/bulk-owned', bulkOperationLimiter, bulkRemoveOwnedUserCards);
userCardsRouter.post('/', createUserCard);
userCardsRouter.get('/me', getMyUserCards);
userCardsRouter.patch('/:id', updateUserCard);
userCardsRouter.delete('/:id', deleteUserCard);

export { userCardsRouter };
