import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { assessCropOpportunities } from './crop.service';
import { successResponse } from '../../shared/errors';

export const cropRouter = Router();

const assessmentSchema = z.object({
  season: z
    .string()
    .transform((s) => s.toUpperCase() as 'KHARIF' | 'RABI' | 'ZAID')
    .pipe(z.enum(['KHARIF', 'RABI', 'ZAID'])),
  soilType: z
    .string()
    .transform((st) => (st.toLowerCase() === 'loam' ? 'Loamy' : st))
    .pipe(
      z.enum(['Black Cotton', 'Alluvial', 'Red Laterite', 'Sandy', 'Sandy Loam', 'Clay', 'Loamy', 'Other'])
    )
    .optional(),
  soilPh: z.number().min(0).max(14).optional(),
  annualRainfallMm: z.number().nonnegative().optional(),
  waterAvailability: z
    .string()
    .transform((w) => w.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH')
    .pipe(z.enum(['LOW', 'MEDIUM', 'HIGH']))
    .optional(),
  state: z.string().optional(),
});

cropRouter.post(
  '/crop-assessments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = assessmentSchema.parse(req.body);
      const result = await assessCropOpportunities(input);
      return successResponse(res, result);
    } catch (e) { return next(e); }
  }
);
