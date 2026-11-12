import { describe, it, expect, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { Crop } from '../models/Crop';
import { Mandi } from '../models/Mandi';
import { MandiPrice } from '../models/MandiPrice';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { Village } from '../models/Village';
import { WeatherRecord } from '../models/WeatherRecord';
import { FarmTask } from '../models/FarmTask';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

describe('MongoDB Database Functionality & Model CRUD Verification', () => {
  beforeEach(async () => {
    // Clean all collections before each test run
    await Promise.all([
      Crop.deleteMany({}),
      Mandi.deleteMany({}),
      MandiPrice.deleteMany({}),
      GovernmentScheme.deleteMany({}),
      Village.deleteMany({}),
      WeatherRecord.deleteMany({}),
      FarmTask.deleteMany({}),
      User.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  });

  // ── 1. Crop Model CRUD ────────────────────────────────────────────────────────
  describe('Crop Model', () => {
    it('creates, reads, updates, and deletes a crop document', async () => {
      const created = await Crop.create({
        name: 'Wheat Test',
        localName: 'Gehun',
        category: 'CEREAL',
        seasons: ['RABI'],
        conditions: {
          minTempC: 10,
          maxTempC: 25,
          minRainfallMm: 300,
          waterRequirement: 'MEDIUM',
        },
        conditionsVerified: false,
      });

      expect(created._id).toBeDefined();
      expect(created.name).toBe('Wheat Test');

      const found = await Crop.findOne({ name: 'Wheat Test' }).lean();
      expect(found).not.toBeNull();
      expect(found?.category).toBe('CEREAL');

      const updated = await Crop.findByIdAndUpdate(
        created._id,
        { $set: { conditionsVerified: true, localName: 'Gehun Sharbati' } },
        { new: true }
      );
      expect(updated?.conditionsVerified).toBe(true);
      expect(updated?.localName).toBe('Gehun Sharbati');

      await Crop.findByIdAndDelete(created._id);
      const afterDelete = await Crop.findById(created._id);
      expect(afterDelete).toBeNull();
    });

    it('enforces unique crop name constraint', async () => {
      await Crop.create({
        name: 'Mustard Unique',
        category: 'OILSEED',
        seasons: ['RABI'],
      });

      await expect(
        Crop.create({
          name: 'Mustard Unique',
          category: 'OILSEED',
          seasons: ['RABI'],
        })
      ).rejects.toThrow();
    });
  });

  // ── 2. Mandi Model CRUD ───────────────────────────────────────────────────────
  describe('Mandi Model', () => {
    it('creates and queries mandi with geographic coordinates', async () => {
      const mandi = await Mandi.create({
        name: 'Mohanlalganj Test',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        latitude: 26.68,
        longitude: 80.98,
        coordinatesVerified: true,
      });

      expect(mandi._id).toBeDefined();

      const found = await Mandi.findOne({ state: 'Uttar Pradesh', district: 'Lucknow' });
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Mohanlalganj Test');
    });

    it('enforces unique compound index on name, district, and state', async () => {
      await Mandi.create({
        name: 'Indore Mandi',
        district: 'Indore',
        state: 'Madhya Pradesh',
      });

      await expect(
        Mandi.create({
          name: 'Indore Mandi',
          district: 'Indore',
          state: 'Madhya Pradesh',
        })
      ).rejects.toThrow();
    });
  });

  // ── 3. MandiPrice Model with References & Provenance ─────────────────────────
  describe('MandiPrice Model', () => {
    it('creates price record with references and verifies populate', async () => {
      const crop = await Crop.create({
        name: 'Gram Test',
        category: 'PULSE',
        seasons: ['RABI'],
      });

      const mandi = await Mandi.create({
        name: 'Aishbagh Mandi',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
      });

      const price = await MandiPrice.create({
        mandiId: mandi._id,
        cropId: crop._id,
        observationDate: new Date('2026-10-15'),
        modalPriceInr: 5400,
        minPriceInr: 5200,
        maxPriceInr: 5600,
        unit: 'quintal',
        dataType: 'SYNTHETIC_DEMO',
        sourceName: 'Krishi Setu Test Fixtures',
      });

      expect(price._id).toBeDefined();

      const populated = await MandiPrice.findById(price._id)
        .populate<{ mandiId: { name: string } }>('mandiId', 'name')
        .populate<{ cropId: { name: string } }>('cropId', 'name')
        .lean();

      expect(populated?.mandiId.name).toBe('Aishbagh Mandi');
      expect(populated?.cropId.name).toBe('Gram Test');
      expect(populated?.modalPriceInr).toBe(5400);
      expect(populated?.dataType).toBe('SYNTHETIC_DEMO');
    });
  });

  // ── 4. GovernmentScheme Model CRUD ────────────────────────────────────────────
  describe('GovernmentScheme Model', () => {
    it('creates and filters government schemes by state', async () => {
      await GovernmentScheme.create({
        schemeCode: 'PM-KISAN-TEST',
        schemeName: 'PM-KISAN Test Support',
        ministry: 'Ministry of Agriculture',
        benefitType: 'Direct Benefit Transfer',
        benefitDescription: 'Rs 6000 per year',
        applicableStates: [], // All-India
        eligibilitySummary: 'Small and marginal farmers',
        officialUrl: 'https://pmkisan.gov.in',
        status: 'ACTIVE',
      });

      await GovernmentScheme.create({
        schemeCode: 'UP-FARM-TEST',
        schemeName: 'UP Specific Assistance',
        ministry: 'UP Agriculture Dept',
        benefitType: 'Subsidy',
        benefitDescription: 'State irrigation assistance',
        applicableStates: ['Uttar Pradesh'],
        eligibilitySummary: 'UP resident cultivators',
        officialUrl: 'https://upagriculture.com',
        status: 'ACTIVE',
      });

      const allIndia = await GovernmentScheme.find({
        $or: [{ applicableStates: { $size: 0 } }, { applicableStates: 'Uttar Pradesh' }],
      });
      expect(allIndia.length).toBe(2);

      const mpOnly = await GovernmentScheme.find({
        $or: [{ applicableStates: { $size: 0 } }, { applicableStates: 'Madhya Pradesh' }],
      });
      expect(mpOnly.length).toBe(1);
      expect(mpOnly[0].schemeCode).toBe('PM-KISAN-TEST');
    });
  });

  // ── 5. Village Model CRUD ─────────────────────────────────────────────────────
  describe('Village Model', () => {
    it('creates, reads, and updates pilot village', async () => {
      const village = await Village.create({
        name: 'Kukrail Test',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        block: 'Bakshi Ka Talab',
        pincode: '226026',
        latitude: 26.90,
        longitude: 80.95,
        coordinatesVerified: true,
        population: 3400,
      });

      expect(village._id).toBeDefined();

      const found = await Village.findById(village._id);
      expect(found?.block).toBe('Bakshi Ka Talab');

      await Village.findByIdAndUpdate(village._id, { $set: { population: 3550 } });
      const updated = await Village.findById(village._id);
      expect(updated?.population).toBe(3550);
    });
  });

  // ── 6. WeatherRecord Compound Upsert & Date Indexing ──────────────────────────
  describe('WeatherRecord Model', () => {
    it('performs idempotent upsert without duplicating records for same date/coordinates', async () => {
      const lat = 26.8467;
      const lon = 80.9462;
      const date = new Date('2026-11-10T00:00:00.000Z');

      await WeatherRecord.updateOne(
        { latitude: lat, longitude: lon, date, recordType: 'FORECAST' },
        {
          $set: {
            maxTempC: 28,
            minTempC: 15,
            precipitationSumMm: 0,
            weatherCode: 0,
            sourceName: 'Open-Meteo',
            sourceUrl: 'https://open-meteo.com',
            retrievedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Upsert again with revised temperature
      await WeatherRecord.updateOne(
        { latitude: lat, longitude: lon, date, recordType: 'FORECAST' },
        {
          $set: {
            maxTempC: 29,
            minTempC: 16,
            retrievedAt: new Date(),
          },
        },
        { upsert: true }
      );

      const records = await WeatherRecord.find({ latitude: lat, longitude: lon, date });
      expect(records.length).toBe(1);
      expect(records[0].maxTempC).toBe(29);
      expect(records[0].minTempC).toBe(16);
    });
  });

  // ── 7. FarmTask Model CRUD ────────────────────────────────────────────────────
  describe('FarmTask Model', () => {
    it('creates, toggles completion, and deletes farm tasks', async () => {
      const task = await FarmTask.create({
        title: 'Check CRI stage moisture',
        cropName: 'Wheat',
        category: 'IRRIGATION',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        completed: false,
      });

      expect(task._id).toBeDefined();
      expect(task.completed).toBe(false);

      const updated = await FarmTask.findByIdAndUpdate(
        task._id,
        { $set: { completed: true, completedAt: new Date() } },
        { new: true }
      );
      expect(updated?.completed).toBe(true);
      expect(updated?.completedAt).toBeDefined();

      await FarmTask.findByIdAndDelete(task._id);
      const afterDel = await FarmTask.findById(task._id);
      expect(afterDel).toBeNull();
    });
  });

  // ── 8. User Model & Validation ────────────────────────────────────────────────
  describe('User Model', () => {
    it('validates 10-digit Indian phone format and creates user', async () => {
      const user = await User.create({
        name: 'Ramesh Yadav Test',
        phone: '9876543210',
        passwordHash: 'hashed_password_sample_123',
        state: 'Uttar Pradesh',
        district: 'Lucknow',
        farmSizeAcres: 2.4,
        soilType: 'Loam',
      });

      expect(user._id).toBeDefined();
      expect(user.phone).toBe('9876543210');

      // Attempting invalid phone number should fail validation
      await expect(
        User.create({
          name: 'Invalid Phone Farmer',
          phone: '12345',
          passwordHash: 'hash',
        })
      ).rejects.toThrow();
    });
  });

  // ── 9. Notification Model CRUD & Status Updates ───────────────────────────────
  describe('Notification Model', () => {
    it('creates notification and updates read status', async () => {
      const notif = await Notification.create({
        category: 'WEATHER',
        severity: 'WARNING',
        title: 'Rain Alert: Irrigation Delay',
        message: 'Precipitation forecasted on Friday. Hold scheduled pumping.',
        link: 'weather',
        isRead: false,
      });

      expect(notif._id).toBeDefined();
      expect(notif.isRead).toBe(false);

      await Notification.findByIdAndUpdate(notif._id, {
        $set: { isRead: true, readAt: new Date() },
      });

      const updated = await Notification.findById(notif._id);
      expect(updated?.isRead).toBe(true);
      expect(updated?.readAt).toBeDefined();
    });
  });
});
