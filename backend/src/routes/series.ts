import { Router } from 'express';
import { getSeries, getSeriesSets } from '../controllers/series';

const seriesRouter = Router();

seriesRouter.get('/', getSeries);
seriesRouter.get('/:seriesName/sets', getSeriesSets);

export { seriesRouter };
