import { Router } from 'express';
import { cardsRouter } from './cards';
import { heartbeatRouter } from './heartbeat';
import { userCardsRouter } from './userCards';

const router = Router();

const v1Router = Router();
v1Router.use('/heartbeat', heartbeatRouter);
v1Router.use('/cards', cardsRouter);
v1Router.use('/user-cards', userCardsRouter);

router.use('/v1', v1Router);

export { router };
