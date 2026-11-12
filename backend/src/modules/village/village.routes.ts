import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Village } from '../../models/Village';
import { getVillageDashboard } from './village.service';
import { successResponse } from '../../shared/errors';
import { paginationSchema } from '../../shared/validators';

export const villageRouter = Router();

// GET /villages
villageRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.state) filter.state = req.query.state;
    if (req.query.district) filter.district = req.query.district;

    const [villages, total] = await Promise.all([
      Village.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-__v')
        .lean(),
      Village.countDocuments(filter),
    ]);

    return successResponse(res, villages, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (e) { return next(e); }
});

// GET /villages/:id
villageRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const village = await Village.findById(id).select('-__v').lean();
    if (!village) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Village not found' },
      });
    }
    return successResponse(res, village);
  } catch (e) { return next(e); }
});

// GET /villages/:id/dashboard
villageRouter.get(
  '/:id/dashboard',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const dashboard = await getVillageDashboard(id);
      return successResponse(res, dashboard);
    } catch (e) { return next(e); }
  }
);
