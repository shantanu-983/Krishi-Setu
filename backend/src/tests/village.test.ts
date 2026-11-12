import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { Village } from '../models/Village';
import { Mandi } from '../models/Mandi';
import { Crop } from '../models/Crop';
import { MandiPrice } from '../models/MandiPrice';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { WeatherRecord } from '../models/WeatherRecord';
import { getVillageDashboard } from '../modules/village/village.service';
import { NotFoundError } from '../shared/errors';

describe('Village Agriculture Dashboard — Integration & Graceful Degradation', () => {
  let villageWithCoordsId: string;
  let villageNoCoordsId: string;

  beforeEach(async () => {
    await Village.deleteMany({});
    await Mandi.deleteMany({});
    await Crop.deleteMany({});
    await MandiPrice.deleteMany({});
    await GovernmentScheme.deleteMany({});
    await WeatherRecord.deleteMany({});

    // 1. Create village with coordinates
    const v1 = await Village.create({
      name: 'Sanwer',
      district: 'Indore',
      state: 'Madhya Pradesh',
      latitude: 22.9694,
      longitude: 75.8309,
      coordinatesVerified: true,
      isActive: true,
    });
    villageWithCoordsId = String(v1._id);

    // 2. Create village without coordinates
    const v2 = await Village.create({
      name: 'Remote Village',
      district: 'Bhopal',
      state: 'Madhya Pradesh',
      coordinatesVerified: false,
      isActive: true,
    });
    villageNoCoordsId = String(v2._id);

    // 3. Create active crop
    const crop = await Crop.create({
      name: 'Soybean',
      category: 'OILSEED',
      seasons: ['KHARIF'],
      conditions: {},
      conditionsVerified: false,
      isActive: true,
    });

    // 4. Create mandi + price in Madhya Pradesh
    const mandi = await Mandi.create({
      name: 'Indore Mandi',
      district: 'Indore',
      state: 'Madhya Pradesh',
      isActive: true,
    });

    await MandiPrice.create({
      mandiId: mandi._id,
      cropId: crop._id,
      observationDate: new Date(),
      modalPriceInr: 4200,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Krishi Setu Test Fixtures',
      retrievedAt: new Date(),
    });

    // 5. Create scheme applicable to MP
    await GovernmentScheme.create({
      schemeCode: 'PM-KISAN',
      schemeName: 'PM Kisan',
      ministry: 'Agri Ministry',
      benefitType: 'Direct Support',
      benefitDescription: '₹6000',
      applicableStates: [],
      eligibilitySummary: 'Eligible farmers',
      eligibilityDetails: [],
      exclusions: [],
      officialUrl: 'https://pmkisan.gov.in',
      status: 'ACTIVE',
      isActive: true,
    });
  });

  it('aggregates all modules successfully for village with coordinates and cached weather', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await WeatherRecord.create({
      latitude: 22.9694,
      longitude: 75.8309,
      recordType: 'FORECAST',
      date: futureDate,
      maxTempC: 32,
      minTempC: 20,
      sourceName: 'Open-Meteo',
      sourceUrl: 'https://open-meteo.com',
      retrievedAt: new Date(),
    });

    const dashboard = await getVillageDashboard(villageWithCoordsId);

    expect(dashboard.village.name).toBe('Sanwer');
    expect(dashboard.weather.status).toBe('AVAILABLE');
    expect(dashboard.mandiPrices.status).toBe('AVAILABLE');
    expect(dashboard.crops.status).toBe('AVAILABLE');
    expect(dashboard.schemes.status).toBe('AVAILABLE');

    // Both old flat and new grouped keys must exist for full UI compatibility
    expect(dashboard.weather.data?.today).toBeDefined();
    expect(dashboard.weather.data?.today?.maxTempC).toBe(32);
    expect(dashboard.weather.data?.forecast).toBeDefined();

    expect(dashboard.mandiPrices.data?.entries).toHaveLength(1);
    expect(dashboard.mandiPrices.data?.entries[0].modalPriceInr).toBe(4200);
    expect(dashboard.mandiPrices.data?.mandis).toHaveLength(1);
    expect(dashboard.mandiPrices.data?.mandis[0].prices[0].cropName).toBe('Soybean');

    expect(dashboard.schemes.data?.activeSchemes).toHaveLength(1);
    expect(dashboard.schemes.data?.applicableSchemes).toHaveLength(1);
    expect(dashboard.schemes.data?.applicableSchemes[0].schemeCode).toBe('PM-KISAN');

    expect(dashboard.crops.data?.seasonalCrops).toHaveLength(1);
    expect(dashboard.crops.data?.activeCrops).toHaveLength(1);
  });

  it('handles missing weather gracefully without failing the entire dashboard', async () => {
    // Force external weather API to fail
    const spy = vi.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Open-Meteo connection timed out'));

    const dashboard = await getVillageDashboard(villageWithCoordsId);

    expect(dashboard.village.name).toBe('Sanwer');
    // Weather is unavailable, but other sections succeed!
    expect(dashboard.weather.status).toBe('UNAVAILABLE');
    expect(dashboard.weather.message).toMatch(/(unavailable|failed)/i);
    expect(dashboard.mandiPrices.status).toBe('AVAILABLE');
    expect(dashboard.crops.status).toBe('AVAILABLE');
    expect(dashboard.schemes.status).toBe('AVAILABLE');

    spy.mockRestore();
  });

  it('handles village without coordinates gracefully', async () => {
    const dashboard = await getVillageDashboard(villageNoCoordsId);

    expect(dashboard.village.name).toBe('Remote Village');
    expect(dashboard.weather.status).toBe('UNAVAILABLE');
    expect(dashboard.weather.message).toContain('coordinates are not available');
    expect(dashboard.crops.status).toBe('AVAILABLE');
  });

  it('throws NotFoundError when village does not exist', async () => {
    await expect(getVillageDashboard('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundError);
  });
});
