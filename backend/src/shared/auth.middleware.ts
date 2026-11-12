import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser } from '../models/User';
import { AuthenticationError, AuthorizationError } from './errors';

export interface AuthJwtPayload {
  userId: string;
  phone: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required. Missing Bearer token.');
    }

    const token = authHeader.split(' ')[1];
    let payload: AuthJwtPayload;
    try {
      payload = jwt.verify(token, config.JWT_SECRET) as AuthJwtPayload;
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new AuthenticationError('Session expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid authentication token.');
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User account not found or inactive.');
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AuthorizationError('Admin access required for this operation.'));
  }
  return next();
}
