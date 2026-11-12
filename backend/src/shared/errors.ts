import { Request, Response, NextFunction } from 'express';

// ─── Standard API response envelope ───────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  const body: ApiSuccess<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  const body: ApiError = { success: false, error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return res.status(statusCode).json(body);
}

// ─── Custom error classes ──────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(401, 'AUTHENTICATION_REQUIRED', message, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(403, 'FORBIDDEN', message, details);
    this.name = 'AuthorizationError';
  }
}

export class ExternalApiError extends AppError {
  constructor(provider: string, message: string) {
    super(502, 'EXTERNAL_API_ERROR', `${provider}: ${message}`);
    this.name = 'ExternalApiError';
  }
}

// ─── Global error handler middleware ──────────────────────────────────────────

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.code, err.message, err.details);
  }

  // Mongoose validation errors
  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'ValidationError'
  ) {
    return errorResponse(res, 400, 'DB_VALIDATION_ERROR', 'Database validation failed', err);
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'CastError'
  ) {
    return errorResponse(res, 400, 'INVALID_IDENTIFIER', 'Invalid resource identifier format');
  }

  // Zod validation errors (passed explicitly)
  if (
    err &&
    typeof err === 'object' &&
    'issues' in err
  ) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Request validation failed', err);
  }

  // Unknown errors — do not leak details
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev && err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error('Unhandled error:', err);
  return errorResponse(res, 500, 'INTERNAL_ERROR', message);
}
