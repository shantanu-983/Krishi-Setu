import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listSchemes, getSchemeById } from './schemes.service';
import { successResponse } from '../../shared/errors';
import { paginationSchema } from '../../shared/validators';

export const schemesRouter = Router();

const schemeSearchSchema = paginationSchema.extend({
  state: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'REQUIRES_VERIFICATION']).optional(),
  search: z.string().optional(),
});

// GET /schemes
schemesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = schemeSearchSchema.parse(req.query);
    const result = await listSchemes(params);
    return successResponse(res, result.schemes, 200, result.pagination);
  } catch (e) { return next(e); }
});

// GET /schemes/:id
schemesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scheme = await getSchemeById(id);
    return successResponse(res, scheme);
  } catch (e) { return next(e); }
});
