import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import {
  syncAndGetNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notifications.service';
import { successResponse, errorResponse } from '../../shared/errors';

export const notificationsRouter = Router();

function getOptionalUserId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      return payload.userId;
    } catch {
      // Ignore invalid or expired token
    }
  }
  return undefined;
}

// GET /api/v1/notifications
notificationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getOptionalUserId(req);
    const notifications = await syncAndGetNotifications(userId);
    return successResponse(res, notifications, 200);
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = getOptionalUserId(req);
    const updated = await markNotificationAsRead(id, userId);
    return successResponse(res, { success: updated, id });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getOptionalUserId(req);
    const count = await markAllNotificationsAsRead(userId);
    return successResponse(res, { success: true, count });
  } catch (err) {
    return next(err);
  }
});
