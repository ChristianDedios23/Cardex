import { Router } from 'express';
import { heartbeatRouter } from './heartbeat';

const router = Router();

const v1Router = Router();
v1Router.use('/heartbeat', heartbeatRouter);

router.use('/v1', v1Router);

export { router };
