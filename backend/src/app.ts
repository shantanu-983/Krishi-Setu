import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins } from './config/env';
import { globalErrorHandler } from './shared/errors';
import { healthRouter } from './routes/health.routes';
import { docsRouter } from './routes/docs.routes';
import { mandiRouter } from './modules/mandi/mandi.routes';
import { cropRouter } from './modules/crop/crop.routes';
import { weatherRouter } from './modules/weather/weather.routes';
import { schemesRouter } from './modules/schemes/schemes.routes';
import { villageRouter } from './modules/village/village.routes';
import { authRouter } from './modules/auth/auth.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';

export function createApp() {
  const app = express();

  // ── Security & Middleware ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow any localhost / 127.0.0.1 port in non-production
        if (process.env.NODE_ENV !== 'production') {
          if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
          }
        }

        // Allow explicitly configured origins
        if (corsOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // ── API Routes ───────────────────────────────────────────────────────────────
  const api = '/api/v1';

  app.use(api, healthRouter);
  app.use(api, docsRouter);
  app.use(api, mandiRouter);
  app.use(api, cropRouter);
  app.use(api, weatherRouter);
  app.use(`${api}/schemes`, schemesRouter);
  app.use(`${api}/villages`, villageRouter);
  app.use(`${api}/auth`, authRouter);
  app.use(`${api}/tasks`, tasksRouter);
  app.use(`${api}/ai`, aiRouter);
  app.use(`${api}/notifications`, notificationsRouter);

  // ── 404 Handler ──────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────────
  app.use(globalErrorHandler);

  return app;
}
