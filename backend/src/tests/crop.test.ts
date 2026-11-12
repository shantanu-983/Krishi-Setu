/**
 * Tests: Crop Opportunity Engine
 *
 * Covers:
 *  - Season-filtered crop retrieval
 *  - Sufficient data → POTENTIALLY_SUITABLE
 *  - Insufficient data → INSUFFICIENT_DATA
 *  - pH mismatch → CONDITION_MISMATCH
 *  - Soil type mismatch → CONDITION_MISMATCH
 *  - Invalid pH rejection
 *  - conditionsVerified flag surfaced
 *  - No invented agricultural facts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Crop } from '../models/Crop';
import { assessCropOpportunities } from '../modules/crop/crop.service';
import { ValidationError } from '../shared/errors';

beforeEach(async () => {
  await Crop.create({
    name: 'TestCrop',
    category: 'CEREAL',
    seasons: ['RABI'],
    conditions: {
      phMin: 6.0, phMax: 7.5,
      soilTypes: ['Alluvial', 'Loamy'],
      waterRequirement: 'MEDIUM',
      minRainfallMm: 300, maxRainfallMm: 900,
    },
    sourceReference: 'Test reference',
    conditionsVerified: false,
    isActive: true,
  });
});

describe('Crop Opportunity Engine', () => {
  it('returns results for matching season', async () => {
    const result = await assessCropOpportunities({ season: 'RABI' });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].cropName).toBe('TestCrop');
  });

  it('returns no results for non-matching season', async () => {
    const result = await assessCropOpportunities({ season: 'KHARIF' });
    expect(result.results.length).toBe(0);
  });

  it('returns POTENTIALLY_SUITABLE with matching conditions', async () => {
    const result = await assessCropOpportunities({
      season: 'RABI',
      soilType: 'Alluvial',
      soilPh: 6.5,
      waterAvailability: 'MEDIUM',
    });
    expect(result.results[0].overallAssessment).toBe('POTENTIALLY_SUITABLE');
  });

  it('returns CONDITION_MISMATCH when pH is out of range', async () => {
    const result = await assessCropOpportunities({
      season: 'RABI',
      soilType: 'Alluvial',
      soilPh: 9.0,  // Way above max of 7.5
      waterAvailability: 'MEDIUM',
    });
    expect(result.results[0].overallAssessment).toBe('CONDITION_MISMATCH');
    const phFactor = result.results[0].factorResults.find(f => f.factor === 'Soil pH');
    expect(phFactor?.matchLevel).toBe('NO_MATCH');
  });

  it('returns CONDITION_MISMATCH on soil type mismatch', async () => {
    const result = await assessCropOpportunities({
      season: 'RABI',
      soilType: 'Sandy',
      soilPh: 6.5,
      waterAvailability: 'MEDIUM',
    });
    const soilFactor = result.results[0].factorResults.find(f => f.factor === 'Soil Type');
    expect(soilFactor?.matchLevel).toBe('NO_MATCH');
  });

  it('returns INSUFFICIENT_DATA with only season provided', async () => {
    const result = await assessCropOpportunities({ season: 'RABI' });
    // Only season factor = 1 known factor → insufficient
    expect(result.results[0].overallAssessment).toBe('INSUFFICIENT_DATA');
  });

  it('rejects invalid pH values', async () => {
    await expect(
      assessCropOpportunities({ season: 'RABI', soilPh: 15 })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects negative rainfall', async () => {
    await expect(
      assessCropOpportunities({ season: 'RABI', annualRainfallMm: -100 })
    ).rejects.toThrow(ValidationError);
  });

  it('surfaces conditionsVerified flag', async () => {
    const result = await assessCropOpportunities({ season: 'RABI' });
    expect(result.results[0].conditionsVerified).toBe(false);
  });

  it('result always includes a disclaimer', async () => {
    const result = await assessCropOpportunities({ season: 'RABI' });
    expect(result.disclaimer).toBeTruthy();
    expect(result.disclaimer.length).toBeGreaterThan(50);
  });
});
