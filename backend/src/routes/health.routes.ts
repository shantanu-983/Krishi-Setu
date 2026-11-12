import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../shared/errors';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  const status = dbState === 1 ? 'ok' : 'degraded';

  return successResponse(res, {
    status,
    version: '1.0.0',
    project: 'Krishi Setu',
    environment: process.env.NODE_ENV ?? 'unknown',
    database: { status: dbStatus },
    timestamp: new Date().toISOString(),
  }, status === 'ok' ? 200 : 503);
});

healthRouter.get('/data-sources/status', (_req: Request, res: Response) => {
  return successResponse(res, {
    sources: [
      {
        id: 'DS-01',
        name: 'OGD Mandi Dataset (data.gov.in)',
        status: 'DOCUMENTATION_REVIEWED',
        authRequired: true,
        authStatus: 'API_KEY_NOT_YET_OBTAINED',
        note: 'Register at https://data.gov.in/user/register to obtain a free API key.',
        integrationStatus: 'NOT_IMPLEMENTED',
      },
      {
        id: 'DS-02',
        name: 'Agmarknet Third-Party Wrapper',
        status: 'REJECTED',
        reason: 'Unauthorized header-spoofing; not sanctioned by government portal terms.',
        integrationStatus: 'NOT_APPLICABLE',
      },
      {
        id: 'DS-03',
        name: 'Open-Meteo Forecast API',
        status: 'DOCUMENTATION_REVIEWED',
        authRequired: false,
        integrationStatus: 'IMPLEMENTED',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
      },
      {
        id: 'DS-05',
        name: 'Leaflet.js',
        status: 'IDENTIFIED',
        integrationStatus: 'FRONTEND_ONLY',
      },
      {
        id: 'DS-06',
        name: 'OpenStreetMap Tiles',
        status: 'DOCUMENTATION_REVIEWED',
        integrationStatus: 'FRONTEND_ONLY',
        policyNote: 'Custom User-Agent and HTTP cache headers required per OSM tile policy.',
      },
      {
        id: 'DS-08',
        name: 'Soil Health Card Portal',
        status: 'IDENTIFIED',
        integrationStatus: 'NOT_IMPLEMENTED',
        reason: 'No public API available. User self-entry required for MVP.',
      },
      {
        id: 'DS-11',
        name: 'PM-KISAN',
        status: 'DOCUMENTATION_REVIEWED',
        integrationStatus: 'MANUALLY_CURATED',
        note: 'Scheme data manually curated from pmkisan.gov.in. No automation API available.',
      },
    ],
    generatedAt: new Date().toISOString(),
  });
});
