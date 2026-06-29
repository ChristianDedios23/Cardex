import { Router } from 'express';
import { createReport, listReports } from '../controllers/reports';
import { optionalAuth } from '../middleware/optionalAuth';

const reportsRouter = Router();

reportsRouter.get('/', listReports);
reportsRouter.post('/', optionalAuth, createReport);

export { reportsRouter };
