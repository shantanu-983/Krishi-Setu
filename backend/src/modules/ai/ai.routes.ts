import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { processAgriQuery } from './ai.service';
import { successResponse } from '../../shared/errors';

export const aiRouter = Router();

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Message is too long (max 1000 chars)'),
  language: z.enum(['en', 'hi']).optional().default('en'),
  farmerContext: z
    .object({
      name: z.string().optional(),
      state: z.string().optional(),
      district: z.string().optional(),
      farmSizeAcres: z.number().optional(),
      primaryCrops: z.array(z.string()).optional(),
      soilType: z.string().optional(),
    })
    .optional(),
});

aiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = chatRequestSchema.parse(req.body);
    const result = await processAgriQuery(input.message, input.language, input.farmerContext);
    return successResponse(res, result, 200);
  } catch (err) {
    return next(err);
  }
});
