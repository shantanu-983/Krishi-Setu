import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { getTasks, createTask, updateTask, deleteTask } from './tasks.service';
import { successResponse } from '../../shared/errors';

export const tasksRouter = Router();

// Middleware to optionally extract userId from Bearer token
function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      (req as any).authUserId = payload.userId;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title is required').max(200),
  cropName: z.string().trim().optional(),
  category: z.enum(['SOWING', 'IRRIGATION', 'FERTILIZER', 'PEST_CONTROL', 'HARVESTING', 'GENERAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().trim().max(1000).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  cropName: z.string().trim().optional(),
  category: z.enum(['SOWING', 'IRRIGATION', 'FERTILIZER', 'PEST_CONTROL', 'HARVESTING', 'GENERAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().optional(),
  completed: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional(),
});

tasksRouter.use(optionalAuth);

// ─── GET /api/v1/tasks ─────────────────────────────────────────────────────────
tasksRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).authUserId;
    const tasks = await getTasks(userId);
    return successResponse(res, tasks, 200);
  } catch (err) {
    return next(err);
  }
});

// ─── POST /api/v1/tasks ────────────────────────────────────────────────────────
tasksRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).authUserId;
    const input = createTaskSchema.parse(req.body);
    const task = await createTask(userId, input);
    return successResponse(res, task, 201);
  } catch (err) {
    return next(err);
  }
});

// ─── PATCH /api/v1/tasks/:id ───────────────────────────────────────────────────
tasksRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as any).authUserId;
    const updates = updateTaskSchema.parse(req.body);
    const task = await updateTask(id, userId, updates);
    return successResponse(res, task, 200);
  } catch (err) {
    return next(err);
  }
});

// ─── DELETE /api/v1/tasks/:id ──────────────────────────────────────────────────
tasksRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as any).authUserId;
    await deleteTask(id, userId);
    return successResponse(res, { deleted: true, id }, 200);
  } catch (err) {
    return next(err);
  }
});
