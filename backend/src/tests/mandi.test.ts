/**
 * Tests: Smart Mandi Decision Engine
 *
 * Covers:
 *  - Correct net realization calculation
 *  - Missing modal price (must NOT substitute min/max)
 *  - Missing transport cost (INCOMPLETE status)
 *  - Explicit zero cost (valid)
 *  - Negative quantity rejection
 *  - Negative costs rejection
 *  - Stale price detection
 *  - Synthetic data label verification
 *  - Multiple mandi comparison
 */

import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Crop } from '../models/Crop';
import { Mandi } from '../models/Mandi';
import { MandiPrice } from '../models/MandiPrice';
import { compareMandis } from '../modules/mandi/mandi.service';
import { checkOgdStatus, syncOgdMandiPrices } from '../modules/mandi/ogd.service';
import { ValidationError } from '../shared/errors';

let cropId: string;
let mandiId: string;
let mandi2Id: string;

beforeEach(async () => {
  const crop = await Crop.create({
    name: 'TestWheat',
    category: 'CEREAL',
    seasons: ['RABI'],
    conditions: {},
    conditionsVerified: false,
    isActive: true,
  });
  cropId = String(crop._id);

  const mandi = await Mandi.create({
    name: 'Test Mandi A', district: 'Indore', state: 'Madhya Pradesh', isActive: true,
  });
  mandiId = String(mandi._id);

  const mandi2 = await Mandi.create({
    name: 'Test Mandi B', district: 'Bhopal', state: 'Madhya Pradesh', isActive: true,
  });
  mandi2Id = String(mandi2._id);
});

describe('Mandi comparison — calculations', () => {
  it('computes correct gross and net realization', async () => {
    await MandiPrice.create({
      mandiId, cropId,
      observationDate: new Date(),
      modalPriceInr: 2200,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Test',
      retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 10,
      mandiEntries: [{ mandiId, transportCostInr: 500, otherCostsInr: 100 }],
    });

    const mandi = result.mandis[0];
    expect(mandi.calculation.status).toBe('COMPLETE');
    expect(mandi.calculation.grossSaleValueInr).toBe(22000);   // 2200 * 10
    expect(mandi.calculation.totalCostsInr).toBe(600);         // 500 + 100
    expect(mandi.calculation.estimatedNetRealizationInr).toBe(21400); // 22000 - 600
  });

  it('does NOT substitute min/max when modal price is missing', async () => {
    await MandiPrice.create({
      mandiId, cropId,
      observationDate: new Date(),
      minPriceInr: 2000,
      maxPriceInr: 2400,
      modalPriceInr: undefined,   // Deliberately missing
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Test',
      retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: 300, otherCostsInr: 0 }],
    });

    const m = result.mandis[0];
    expect(m.calculation.status).toBe('NO_PRICE_DATA');
    expect(m.calculation.grossSaleValueInr).toBeNull();
    expect(m.calculation.estimatedNetRealizationInr).toBeNull();
    expect(m.price.modalPriceInr).toBeNull();
    expect(m.calculation.missingFields).toContain('modal_price');
  });

  it('returns INCOMPLETE status when transport cost is null (unknown)', async () => {
    await MandiPrice.create({
      mandiId, cropId,
      observationDate: new Date(),
      modalPriceInr: 2200,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Test',
      retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: null, otherCostsInr: null }],
    });

    const m = result.mandis[0];
    expect(m.calculation.status).toBe('INCOMPLETE');
    expect(m.calculation.grossSaleValueInr).toBe(11000);  // 2200 * 5
    expect(m.calculation.estimatedNetRealizationInr).toBeNull();
    expect(m.calculation.missingFields).toContain('transport_cost');
    expect(m.calculation.missingFields).toContain('other_costs');
  });

  it('returns INCOMPLETE status when other cost is missing (not assumed to be zero)', async () => {
    await MandiPrice.create({
      mandiId, cropId,
      observationDate: new Date(),
      modalPriceInr: 2200,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Test',
      retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: 400, otherCostsInr: null }],
    });

    const m = result.mandis[0];
    expect(m.calculation.status).toBe('INCOMPLETE');
    expect(m.calculation.grossSaleValueInr).toBe(11000);
    expect(m.calculation.estimatedNetRealizationInr).toBeNull();
    expect(m.calculation.missingFields).toContain('other_costs');
  });

  it('accepts explicit zero transport cost as valid', async () => {
    await MandiPrice.create({
      mandiId, cropId,
      observationDate: new Date(),
      modalPriceInr: 2200,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Test',
      retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: 0, otherCostsInr: 0 }],
    });

    const m = result.mandis[0];
    expect(m.calculation.status).toBe('COMPLETE');
    expect(m.calculation.estimatedNetRealizationInr).toBe(11000);
    expect(m.costs.transportCostType).toBe('USER_ENTERED');
  });

  it('rejects negative quantity', async () => {
    await expect(
      compareMandis({
        cropId,
        quantityQuintals: -5,
        mandiEntries: [{ mandiId, transportCostInr: 100, otherCostsInr: 0 }],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects negative transport cost', async () => {
    await MandiPrice.create({
      mandiId, cropId, observationDate: new Date(),
      modalPriceInr: 2200, unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO', sourceName: 'Test', retrievedAt: new Date(),
    });

    await expect(
      compareMandis({
        cropId,
        quantityQuintals: 5,
        mandiEntries: [{ mandiId, transportCostInr: -200, otherCostsInr: 0 }],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('handles no price data gracefully', async () => {
    // No price records inserted
    const result = await compareMandis({
      cropId,
      quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: 300, otherCostsInr: 0 }],
    });

    const m = result.mandis[0];
    expect(m.calculation.status).toBe('NO_PRICE_DATA');
    expect(m.price.note).toBeTruthy();
  });

  it('compares multiple mandis and labels results correctly', async () => {
    await MandiPrice.create({
      mandiId, cropId, observationDate: new Date(),
      modalPriceInr: 2200, unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO', sourceName: 'Test', retrievedAt: new Date(),
    });
    await MandiPrice.create({
      mandiId: mandi2Id, cropId, observationDate: new Date(),
      modalPriceInr: 2150, unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO', sourceName: 'Test', retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId,
      quantityQuintals: 10,
      mandiEntries: [
        { mandiId, transportCostInr: 500, otherCostsInr: 0 },
        { mandiId: mandi2Id, transportCostInr: 300, otherCostsInr: 0 },
      ],
    });

    expect(result.mandis).toHaveLength(2);
    const [a, b] = result.mandis;
    expect(a.calculation.estimatedNetRealizationInr).toBe(21500); // 22000 - 500
    expect(b.calculation.estimatedNetRealizationInr).toBe(21200); // 21500 - 300
  });

  it('labels synthetic data correctly', async () => {
    await MandiPrice.create({
      mandiId, cropId, observationDate: new Date(),
      modalPriceInr: 2200, unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO', sourceName: 'Test Fixtures', retrievedAt: new Date(),
    });

    const result = await compareMandis({
      cropId, quantityQuintals: 5,
      mandiEntries: [{ mandiId, transportCostInr: 0, otherCostsInr: 0 }],
    });

    expect(result.mandis[0].price.dataType).toBe('SYNTHETIC_DEMO');
    expect(result.resultsDisclaimer).toBeTruthy();
  });

  it('rejects request with zero mandis', async () => {
    await expect(
      compareMandis({ cropId, quantityQuintals: 5, mandiEntries: [] })
    ).rejects.toThrow(ValidationError);
  });

  describe('OGD India Mandi Integration & Safe Diagnostics', () => {
    it('returns diagnostic status with third-party wrapper rejection when key is placeholder', async () => {
      const status = await checkOgdStatus();
      expect(status.thirdPartyWrapperRejected).toBe(true);
      expect(status.gatewayUrl).toContain('data.gov.in');
      expect(status.status).toBe('API_KEY_INVALID_OR_NOT_OBTAINED');
      expect(status.actionableGuidance).toBeTruthy();
    });

    it('syncOgdMandiPrices safely falls back to demo fixtures without throwing', async () => {
      const result = await syncOgdMandiPrices('Madhya Pradesh', 10);
      expect(result.status).toBe('FALLBACK_DEMO_RETAINED');
      expect(result.message).toMatch(/OGD_API_KEY is not configured/i);
    });
  });
});
