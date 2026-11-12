import { describe, it, expect, beforeEach } from 'vitest';
import { GovernmentScheme } from '../models/GovernmentScheme';
import { listSchemes, getSchemeById, getSchemeByCode } from '../modules/schemes/schemes.service';
import { NotFoundError } from '../shared/errors';

describe('Government Support Engine — Schemes Service', () => {
  beforeEach(async () => {
    await GovernmentScheme.deleteMany({});

    await GovernmentScheme.create([
      {
        schemeCode: 'PM-KISAN',
        schemeName: 'Pradhan Mantri Kisan Samman Nidhi',
        ministry: 'Ministry of Agriculture & Farmers Welfare',
        benefitType: 'Direct Income Support',
        benefitDescription: '₹6,000 per year in 3 equal instalments',
        applicableStates: [], // All India
        eligibilitySummary: 'Landholder farmer families',
        eligibilityDetails: ['Must own cultivable land', 'eKYC mandatory'],
        exclusions: ['Institutional landholders', 'Income tax payers'],
        officialUrl: 'https://pmkisan.gov.in/',
        status: 'ACTIVE',
        sourceVerifiedAt: new Date('2026-10-30'),
        isActive: true,
      },
      {
        schemeCode: 'MP-KALYAN',
        schemeName: 'Mukhyamantri Kisan Kalyan Yojana',
        ministry: 'Government of Madhya Pradesh',
        benefitType: 'State Income Support',
        benefitDescription: 'Additional ₹4,000 to PM-KISAN beneficiaries in MP',
        applicableStates: ['Madhya Pradesh'],
        eligibilitySummary: 'MP resident PM-KISAN beneficiaries',
        eligibilityDetails: ['Must be registered under PM-KISAN in MP'],
        exclusions: ['Non-MP residents'],
        officialUrl: 'https://saara.mp.gov.in/',
        status: 'ACTIVE',
        sourceVerifiedAt: new Date('2026-10-30'),
        isActive: true,
      },
      {
        schemeCode: 'INACTIVE-SCHEME',
        schemeName: 'Old Scheme',
        ministry: 'Test Ministry',
        benefitType: 'Subsidy',
        benefitDescription: 'Expired pilot subsidy',
        applicableStates: [],
        eligibilitySummary: 'Historical only',
        eligibilityDetails: [],
        exclusions: [],
        officialUrl: 'https://example.gov.in/',
        status: 'INACTIVE',
        isActive: true,
      },
    ]);
  });

  it('lists only active schemes by default', async () => {
    const result = await listSchemes({});
    expect(result.schemes).toHaveLength(2);
    const codes = result.schemes.map((s) => s.schemeCode);
    expect(codes).toContain('PM-KISAN');
    expect(codes).toContain('MP-KALYAN');
    expect(codes).not.toContain('INACTIVE-SCHEME');
  });

  it('filters schemes by state correctly (including all-India schemes)', async () => {
    // When state = Uttar Pradesh, PM-KISAN (all-India) matches, but MP-KALYAN does not
    const upSchemes = await listSchemes({ state: 'Uttar Pradesh' });
    expect(upSchemes.schemes).toHaveLength(1);
    expect(upSchemes.schemes[0].schemeCode).toBe('PM-KISAN');

    // When state = Madhya Pradesh, both match
    const mpSchemes = await listSchemes({ state: 'Madhya Pradesh' });
    expect(mpSchemes.schemes).toHaveLength(2);
  });

  it('retrieves scheme detail by schemeCode (e.g. PM-KISAN)', async () => {
    const scheme = await getSchemeByCode('PM-KISAN');
    expect(scheme.schemeName).toBe('Pradhan Mantri Kisan Samman Nidhi');
    expect(scheme.exclusions).toContain('Income tax payers');
    expect(scheme.disclaimer).toBeTruthy();
    expect(scheme.officialUrl).toBe('https://pmkisan.gov.in/');
  });

  it('retrieves scheme detail by MongoDB ObjectId or code via getSchemeById', async () => {
    const scheme = await getSchemeById('PM-KISAN');
    expect(scheme.schemeCode).toBe('PM-KISAN');

    const byId = await getSchemeById(scheme.id);
    expect(byId.schemeCode).toBe('PM-KISAN');
  });

  it('throws NotFoundError for non-existent scheme', async () => {
    await expect(getSchemeById('NON-EXISTENT-SCHEME')).rejects.toThrow(NotFoundError);
  });
});
