import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fetchWeatherForecast, fetchWeatherHistorical } from './weather.service';
import { successResponse } from '../../shared/errors';

export const weatherRouter = Router();

const weatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locationLabel: z.string().optional(),
  days: z.coerce.number().int().min(1).max(16).default(7),
});

const weatherHistoricalSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format'),
  locationLabel: z.string().optional(),
});

// GET /weather — Forecast (up to 16 days)
weatherRouter.get(
  '/weather',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = weatherQuerySchema.parse(req.query);
      const result = await fetchWeatherForecast(params);
      return successResponse(res, result);
    } catch (e) { return next(e); }
  }
);

// GET /weather/historical — Historical observations from Copernicus ERA5 / Open-Meteo archive
weatherRouter.get(
  '/weather/historical',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = weatherHistoricalSchema.parse(req.query);
      const result = await fetchWeatherHistorical(params);
      return successResponse(res, result);
    } catch (e) { return next(e); }
  }
);
