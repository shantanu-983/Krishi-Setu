import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from './auth.service';
import { requireAuth } from '../../shared/auth.middleware';
import { successResponse } from '../../shared/errors';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['farmer', 'admin']).optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  block: z.string().trim().optional(),
  villageId: z.string().trim().optional(),
  villageName: z.string().trim().optional(),
  preferredLanguage: z.enum(['en', 'hi']).optional(),
  farmSizeAcres: z.number().nonnegative().optional(),
  soilType: z.string().trim().optional(),
  soilPh: z.number().min(0).max(14).optional(),
  irrigationSource: z.string().trim().optional(),
  primaryCrops: z.array(z.string().trim()).optional(),
});

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  block: z.string().trim().optional(),
  villageId: z.string().trim().optional(),
  villageName: z.string().trim().optional(),
  preferredLanguage: z.enum(['en', 'hi']).optional(),
  farmSizeAcres: z.number().nonnegative().optional(),
  soilType: z.string().trim().optional(),
  soilPh: z.number().min(0).max(14).optional(),
  irrigationSource: z.string().trim().optional(),
  primaryCrops: z.array(z.string().trim()).optional(),
});

// ─── POST /api/v1/auth/register ────────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    return successResponse(res, result, 201);
  } catch (err) {
    return next(err);
  }
});

// ─── POST /api/v1/auth/login ───────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    return successResponse(res, result, 200);
  } catch (err) {
    return next(err);
  }
});

// ─── GET /api/v1/auth/me ───────────────────────────────────────────────────────
authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user!._id);
    const profile = await getUserProfile(userId);
    return successResponse(res, profile, 200);
  } catch (err) {
    return next(err);
  }
});

// ─── PUT /api/v1/auth/me ───────────────────────────────────────────────────────
authRouter.put('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.user!._id);
    const updates = updateProfileSchema.parse(req.body);
    const profile = await updateUserProfile(userId, updates);
    return successResponse(res, profile, 200);
  } catch (err) {
    return next(err);
  }
});
