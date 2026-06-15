import { Router } from 'express';
import { heartbeat } from '../controllers/heartbeat';

const heartbeatRouter = Router();

heartbeatRouter.get('/', heartbeat);

export { heartbeatRouter };
