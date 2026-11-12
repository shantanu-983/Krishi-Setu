import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { createApp } from '../app';
import { Crop } from '../models/Crop';
import { Mandi } from '../models/Mandi';
import { MandiPrice } from '../models/MandiPrice';
import { Village } from '../models/Village';
import { GovernmentScheme } from '../models/GovernmentScheme';

vi.mock('axios');

const app = createApp();

describe('Krishi Setu — Full REST API Endpoints (Supertest)', () => {
  let sampleCropId: string;
  let sampleMandiId: string;
  let sampleVillageId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await Crop.deleteMany({});
    await Mandi.deleteMany({});
    await MandiPrice.deleteMany({});
    await Village.deleteMany({});
    await GovernmentScheme.deleteMany({});

    const crop = await Crop.create({
      name: 'Wheat',
      category: 'CEREAL',
      seasons: ['RABI'],
      conditions: { phMin: 6.0, phMax: 7.5 },
      conditionsVerified: true,
      isActive: true,
    });
    sampleCropId = String(crop._id);

    const mandi = await Mandi.create({
      name: 'Indore Mandi',
      district: 'Indore',
      state: 'Madhya Pradesh',
      isActive: true,
    });
    sampleMandiId = String(mandi._id);

    await MandiPrice.create({
      mandiId: mandi._id,
      cropId: crop._id,
      observationDate: new Date('2026-10-30'),
      modalPriceInr: 2250,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Sample Data',
      retrievedAt: new Date(),
    });

    const village = await Village.create({
      name: 'Sanwer',
      district: 'Indore',
      state: 'Madhya Pradesh',
      latitude: 22.9694,
      longitude: 75.8309,
      coordinatesVerified: true,
      isActive: true,
    });
    sampleVillageId = String(village._id);

    await GovernmentScheme.create({
      schemeCode: 'PM-KISAN',
      schemeName: 'PM Kisan Samman Nidhi',
      ministry: 'Agri Ministry',
      benefitType: 'Cash',
      benefitDescription: '₹6000',
      applicableStates: [],
      eligibilitySummary: 'Landholder farmers',
      eligibilityDetails: [],
      exclusions: [],
      officialUrl: 'https://pmkisan.gov.in',
      status: 'ACTIVE',
      isActive: true,
    });
  });

  // ── 1. System Health & Metadata ──────────────────────────────────────────────
  it('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.project).toBe('Krishi Setu');
  });

  it('GET /api/v1/data-sources/status returns external data sources register', async () => {
    const res = await request(app).get('/api/v1/data-sources/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sources.length).toBeGreaterThan(3);
    const ds01 = res.body.data.sources.find((s: { id: string }) => s.id === 'DS-01');
    expect(ds01).toBeDefined();
    expect(ds01.authRequired).toBe(true);
  });

  it('GET /api/v1/openapi.json returns valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('Krishi Setu API');
  });

  // ── 2. Crops Endpoints ───────────────────────────────────────────────────────
  it('GET /api/v1/crops lists crops with pagination', async () => {
    const res = await request(app).get('/api/v1/crops?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Wheat');
    expect(res.body.meta.total).toBe(1);
  });

  it('GET /api/v1/crops/:id returns crop detail', async () => {
    const res = await request(app).get(`/api/v1/crops/${sampleCropId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Wheat');
  });

  it('GET /api/v1/crops/:id returns 404 for missing crop', async () => {
    const res = await request(app).get('/api/v1/crops/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  // ── 3. Mandis Endpoints ──────────────────────────────────────────────────────
  it('GET /api/v1/mandis lists mandis with state filter', async () => {
    const res = await request(app).get('/api/v1/mandis?state=Madhya Pradesh');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Indore Mandi');
  });

  it('GET /api/v1/mandis/:id returns mandi detail', async () => {
    const res = await request(app).get(`/api/v1/mandis/${sampleMandiId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.district).toBe('Indore');
  });

  // ── 4. Prices & Mandi Comparison ─────────────────────────────────────────────
  it('GET /api/v1/prices returns prices with date range and mandi filter', async () => {
    const res = await request(app).get(
      `/api/v1/prices?cropId=${sampleCropId}&from=2026-10-01&to=2026-10-31`
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].modalPriceInr).toBe(2250);
  });

  it('POST /api/v1/mandi-comparison calculates net realization', async () => {
    const res = await request(app)
      .post('/api/v1/mandi-comparison')
      .send({
        cropId: sampleCropId,
        quantityQuintals: 10,
        mandiEntries: [
          { mandiId: sampleMandiId, transportCostInr: 400, otherCostsInr: 50 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const m = res.body.data.mandis[0];
    expect(m.calculation.status).toBe('COMPLETE');
    expect(m.calculation.grossSaleValueInr).toBe(22500); // 2250 * 10
    expect(m.calculation.totalCostsInr).toBe(450);       // 400 + 50
    expect(m.calculation.estimatedNetRealizationInr).toBe(22050);
  });

  it('POST /api/v1/mandi-comparison returns 400 for invalid negative costs', async () => {
    const res = await request(app)
      .post('/api/v1/mandi-comparison')
      .send({
        cropId: sampleCropId,
        quantityQuintals: 10,
        mandiEntries: [{ mandiId: sampleMandiId, transportCostInr: -50 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── 5. Crop Assessments ──────────────────────────────────────────────────────
  it('POST /api/v1/crop-assessments returns suitability assessments', async () => {
    const res = await request(app)
      .post('/api/v1/crop-assessments')
      .send({
        season: 'RABI',
        soilPh: 6.8,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.disclaimer).toBeTruthy();
  });

  // ── 6. Weather Endpoints ─────────────────────────────────────────────────────
  it('GET /api/v1/weather fetches forecast via Open-Meteo', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        latitude: 23.25,
        longitude: 77.41,
        timezone: 'Asia/Kolkata',
        daily: {
          time: ['2026-11-01'],
          temperature_2m_max: [31.0],
          temperature_2m_min: [18.0],
          precipitation_sum: [0.0],
          weathercode: [0],
        },
      },
    });

    const res = await request(app).get(
      '/api/v1/weather?latitude=23.25&longitude=77.41&days=1'
    );
    expect(res.status).toBe(200);
    expect(res.body.data.forecastDays).toHaveLength(1);
    expect(res.body.data.attribution).toContain('Open-Meteo.com');
  });

  // ── 7. Schemes Endpoints ─────────────────────────────────────────────────────
  it('GET /api/v1/schemes returns scheme list with state filtering', async () => {
    const res = await request(app).get('/api/v1/schemes?state=Madhya Pradesh');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].schemeCode).toBe('PM-KISAN');
  });

  it('GET /api/v1/schemes/:id looks up by code e.g. PM-KISAN', async () => {
    const res = await request(app).get('/api/v1/schemes/PM-KISAN');
    expect(res.status).toBe(200);
    expect(res.body.data.schemeName).toBe('PM Kisan Samman Nidhi');
  });

  // ── 8. Village Dashboard ─────────────────────────────────────────────────────
  it('GET /api/v1/villages/:id/dashboard returns integrated dashboard', async () => {
    const res = await request(app).get(
      `/api/v1/villages/${sampleVillageId}/dashboard`
    );
    expect(res.status).toBe(200);
    expect(res.body.data.village.name).toBe('Sanwer');
    expect(res.body.data.mandiPrices.status).toBe('AVAILABLE');
    expect(res.body.data.crops.status).toBe('AVAILABLE');
    expect(res.body.data.schemes.status).toBe('AVAILABLE');
  });

  // ── 9. Error Handling ────────────────────────────────────────────────────────
  it('returns 404 for unknown route', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid MongoDB ObjectId format', async () => {
    const res = await request(app).get('/api/v1/crops/invalid-object-id-123');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_IDENTIFIER');
  });
});
