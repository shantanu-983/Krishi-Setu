/**
 * Krishi Setu — Development Seed Script
 *
 * Seeds the database with CLEARLY LABELLED synthetic demonstration data.
 * This data is for development and testing only.
 *
 * IMPORTANT:
 *  - Every price record is marked dataType: 'SYNTHETIC_DEMO'
 *  - Notes explicitly state this is NOT official government data
 *  - Never run in production without setting ALLOW_SEED=true
 *
 * Run: npx ts-node src/seed/seed.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import mongoose from 'mongoose';
import { Crop } from '../models/Crop';
import { Mandi } from '../models/Mandi';
import { MandiPrice } from '../models/MandiPrice';
import { Village } from '../models/Village';
import { GovernmentScheme } from '../models/GovernmentScheme';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in environment. Copy .env.example to .env and configure it.');
  process.exit(1);
}

if (process.env.ALLOW_SEED !== 'true') {
  console.error('Set ALLOW_SEED=true in your .env to run the seed script.');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('Connected to MongoDB');

  // ── Clear existing data ────────────────────────────────────────────────────
  await Promise.all([
    Crop.deleteMany({}),
    Mandi.deleteMany({}),
    MandiPrice.deleteMany({}),
    Village.deleteMany({}),
    GovernmentScheme.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ── Crops ──────────────────────────────────────────────────────────────────
  // Source: General agricultural knowledge. conditionsVerified: false until expert review.
  const crops = await Crop.insertMany([
    {
      name: 'Wheat',
      localName: 'Gehun',
      category: 'CEREAL',
      seasons: ['RABI'],
      conditions: {
        minTempC: 10, maxTempC: 25,
        minRainfallMm: 300, maxRainfallMm: 1000,
        soilTypes: ['Loamy', 'Clay', 'Alluvial'],
        phMin: 6.0, phMax: 7.5,
        waterRequirement: 'MEDIUM',
        notes: 'Requires cool weather during grain filling. Widely grown in MP and UP.',
      },
      sourceReference: 'General agricultural reference — REQUIRES expert verification before use in assessments',
      conditionsVerified: false,
      ogdCommodityNames: ['Wheat', 'WHEAT', 'Gehun'],
      isActive: true,
    },
    {
      name: 'Soybean',
      localName: 'Soya',
      category: 'OILSEED',
      seasons: ['KHARIF'],
      conditions: {
        minTempC: 20, maxTempC: 35,
        minRainfallMm: 600, maxRainfallMm: 1200,
        soilTypes: ['Black Cotton', 'Alluvial', 'Loamy'],
        phMin: 6.0, phMax: 7.5,
        waterRequirement: 'MEDIUM',
        notes: 'Major Kharif crop in Madhya Pradesh. Sensitive to waterlogging.',
      },
      sourceReference: 'General agricultural reference — REQUIRES expert verification before use in assessments',
      conditionsVerified: false,
      ogdCommodityNames: ['Soyabean', 'Soybean', 'SOYABEAN'],
      isActive: true,
    },
    {
      name: 'Paddy',
      localName: 'Dhan / Chawal',
      category: 'CEREAL',
      seasons: ['KHARIF'],
      conditions: {
        minTempC: 22, maxTempC: 35,
        minRainfallMm: 1000, maxRainfallMm: 2000,
        soilTypes: ['Clay', 'Alluvial', 'Loamy'],
        phMin: 5.5, phMax: 7.0,
        waterRequirement: 'HIGH',
        notes: 'Requires standing water during early growth. Key staple crop in UP.',
      },
      sourceReference: 'General agricultural reference — REQUIRES expert verification before use in assessments',
      conditionsVerified: false,
      ogdCommodityNames: ['Paddy', 'PADDY', 'Rice'],
      isActive: true,
    },
    {
      name: 'Mustard',
      localName: 'Sarson',
      category: 'OILSEED',
      seasons: ['RABI'],
      conditions: {
        minTempC: 5, maxTempC: 25,
        minRainfallMm: 250, maxRainfallMm: 750,
        soilTypes: ['Loamy', 'Sandy Loam', 'Alluvial'],
        phMin: 6.0, phMax: 7.5,
        waterRequirement: 'LOW',
        notes: 'Important Rabi oilseed crop in both MP and UP.',
      },
      sourceReference: 'General agricultural reference — REQUIRES expert verification before use in assessments',
      conditionsVerified: false,
      ogdCommodityNames: ['Mustard', 'Rapeseed', 'MUSTARD', 'Sarson'],
      isActive: true,
    },
    {
      name: 'Gram',
      localName: 'Chana',
      category: 'PULSE',
      seasons: ['RABI'],
      conditions: {
        minTempC: 10, maxTempC: 25,
        minRainfallMm: 400, maxRainfallMm: 700,
        soilTypes: ['Sandy Loam', 'Loamy', 'Black Cotton'],
        phMin: 6.0, phMax: 8.0,
        waterRequirement: 'LOW',
        notes: 'Important pulse crop. Fixes atmospheric nitrogen.',
      },
      sourceReference: 'General agricultural reference — REQUIRES expert verification before use in assessments',
      conditionsVerified: false,
      ogdCommodityNames: ['Gram', 'Chickpea', 'GRAM', 'Chana'],
      isActive: true,
    },
  ]);
  console.log(`Seeded ${crops.length} crops`);

  // ── Mandis ─────────────────────────────────────────────────────────────────
  // Locations are real government mandis. Coordinates are approximate.
  const mandis = await Mandi.insertMany([
    {
      name: 'Indore Mandi', district: 'Indore', state: 'Madhya Pradesh',
      latitude: 22.7196, longitude: 75.8577,
      coordinatesVerified: false, ogdMarketName: 'Indore', isActive: true,
    },
    {
      name: 'Bhopal Mandi', district: 'Bhopal', state: 'Madhya Pradesh',
      latitude: 23.2599, longitude: 77.4126,
      coordinatesVerified: false, ogdMarketName: 'Bhopal', isActive: true,
    },
    {
      name: 'Ujjain Mandi', district: 'Ujjain', state: 'Madhya Pradesh',
      latitude: 23.1765, longitude: 75.7885,
      coordinatesVerified: false, ogdMarketName: 'Ujjain', isActive: true,
    },
    {
      name: 'Kanpur Mandi', district: 'Kanpur Nagar', state: 'Uttar Pradesh',
      latitude: 26.4499, longitude: 80.3319,
      coordinatesVerified: false, ogdMarketName: 'Kanpur', isActive: true,
    },
    {
      name: 'Lucknow Mandi', district: 'Lucknow', state: 'Uttar Pradesh',
      latitude: 26.8467, longitude: 80.9462,
      coordinatesVerified: false, ogdMarketName: 'Lucknow', isActive: true,
    },
  ]);
  console.log(`Seeded ${mandis.length} mandis`);

  // ── Mandi Prices — SYNTHETIC DEMO DATA ────────────────────────────────────
  const wheat = crops.find((c) => c.name === 'Wheat')!;
  const soybean = crops.find((c) => c.name === 'Soybean')!;
  const indore = mandis.find((m) => m.name === 'Indore Mandi')!;
  const bhopal = mandis.find((m) => m.name === 'Bhopal Mandi')!;
  const ujjain = mandis.find((m) => m.name === 'Ujjain Mandi')!;
  const kanpur = mandis.find((m) => m.name === 'Kanpur Mandi')!;
  const lucknow = mandis.find((m) => m.name === 'Lucknow Mandi')!;

  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

  const SYNTHETIC_NOTE =
    'SAMPLE DATA FOR DEMONSTRATION ONLY. NOT official government prices. ' +
    'Do not use for actual selling decisions. Source: Krishi Setu development fixtures.';

  const priceEntries = [
    // Wheat prices — multiple mandis
    { mandiId: indore._id, cropId: wheat._id, observationDate: yesterday, minPriceInr: 2100, maxPriceInr: 2250, modalPriceInr: 2180, variety: 'FAQ' },
    { mandiId: bhopal._id, cropId: wheat._id, observationDate: yesterday, minPriceInr: 2050, maxPriceInr: 2200, modalPriceInr: 2140, variety: 'FAQ' },
    { mandiId: ujjain._id, cropId: wheat._id, observationDate: twoDaysAgo, minPriceInr: 2080, maxPriceInr: 2230, modalPriceInr: 2160, variety: 'FAQ' },
    { mandiId: kanpur._id, cropId: wheat._id, observationDate: yesterday, minPriceInr: 2120, maxPriceInr: 2280, modalPriceInr: 2200, variety: 'FAQ' },
    { mandiId: lucknow._id, cropId: wheat._id, observationDate: yesterday, minPriceInr: 2090, maxPriceInr: 2260, modalPriceInr: 2175, variety: 'FAQ' },
    // Soybean prices
    { mandiId: indore._id, cropId: soybean._id, observationDate: yesterday, minPriceInr: 4000, maxPriceInr: 4300, modalPriceInr: 4150, variety: 'Yellow' },
    { mandiId: ujjain._id, cropId: soybean._id, observationDate: yesterday, minPriceInr: 3950, maxPriceInr: 4250, modalPriceInr: 4100, variety: 'Yellow' },
  ];

  await MandiPrice.insertMany(
    priceEntries.map((e) => ({
      ...e,
      unit: 'quintal',
      dataType: 'SYNTHETIC_DEMO',
      sourceName: 'Krishi Setu Development Fixtures',
      retrievedAt: new Date(),
      notes: SYNTHETIC_NOTE,
    }))
  );
  console.log(`Seeded ${priceEntries.length} synthetic price records (SYNTHETIC_DEMO)`);

  // ── Villages ───────────────────────────────────────────────────────────────
  const villages = await Village.insertMany([
    {
      name: 'Sanwer', district: 'Indore', state: 'Madhya Pradesh', block: 'Sanwer',
      latitude: 22.9694, longitude: 75.8309, coordinatesVerified: false,
      nearbyMandiIds: [String(indore._id)], isActive: true,
    },
    {
      name: 'Berasia', district: 'Bhopal', state: 'Madhya Pradesh', block: 'Berasia',
      latitude: 23.6267, longitude: 77.4322, coordinatesVerified: false,
      nearbyMandiIds: [String(bhopal._id)], isActive: true,
    },
    {
      name: 'Unnao', district: 'Unnao', state: 'Uttar Pradesh', block: 'Unnao Sadar',
      latitude: 26.5376, longitude: 80.4929, coordinatesVerified: false,
      nearbyMandiIds: [String(kanpur._id)], isActive: true,
    },
  ]);
  console.log(`Seeded ${villages.length} villages`);

  // ── Government Schemes ─────────────────────────────────────────────────────
  // Curated from official sources. sourceVerifiedAt: 2026-10-30 (pmkisan.gov.in)
  await GovernmentScheme.insertMany([
    {
      schemeCode: 'PM-KISAN',
      schemeName: 'Pradhan Mantri Kisan Samman Nidhi',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      department: 'Department of Agriculture & Farmers Welfare',
      benefitType: 'Direct Income Support (Cash Transfer)',
      benefitDescription:
        '₹6,000 per year in three instalments of ₹2,000 each (April–July, August–November, December–March), transferred directly to farmer bank accounts.',
      applicableStates: [],  // All India
      eligibilitySummary:
        'Small and marginal farmers owning cultivable land as per state land records. ' +
        'eKYC is mandatory. The benefit covers the entire farmer family (husband, wife, minor children).',
      eligibilityDetails: [
        'Must be a farmer owning cultivable land as per state/UT land records.',
        'Land ownership must be verifiable through revenue records.',
        'One benefit per farmer family (husband + wife + minor children = one unit).',
        'eKYC (Biometric or OTP-based) is mandatory for registration and continuation.',
      ],
      exclusions: [
        'Institutional landholders.',
        'Current or former income tax payers.',
        'Constitutional post holders (current or former).',
        'Serving/retired government employees of Group A, B, or C (Multi-Tasking Staff exempt).',
        'Retired pensioners drawing ≥ ₹10,000/month (MTS exempt).',
        'Professionals (doctors, engineers, lawyers, CAs) registered with professional bodies.',
        'Farmers who acquired land after 01-02-2019 (under verification).',
        'Multiple family members receiving benefits (under review).',
      ],
      documentsRequired: [
        'Aadhaar card (mandatory for eKYC)',
        'Land ownership documents / Khasra-Khatauni',
        'Bank account details (linked to Aadhaar)',
        'Mobile number (for OTP-based eKYC)',
      ],
      applicationInstructions:
        'Farmers can self-register at pmkisan.gov.in → New Farmer Registration. ' +
        'Alternatively, register through CSC (Common Service Centre) or designated state government offices. ' +
        'eKYC completion is mandatory after registration.',
      officialUrl: 'https://pmkisan.gov.in/',
      applicationUrl: 'https://pmkisan.gov.in/RegistrationFormupdated.aspx',
      status: 'ACTIVE',
      sourceVerifiedAt: new Date('2026-10-30'),
      sourceVerifiedBy: 'Manually verified by Krishi Setu team from pmkisan.gov.in on 2026-10-30',
      notes:
        '24th instalment being released on 30 October 2026 (as per portal). ' +
        'eKYC is currently mandatory for all registered farmers.',
      isActive: true,
    },
    {
      schemeCode: 'PMFBY',
      schemeName: 'Pradhan Mantri Fasal Bima Yojana',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      benefitType: 'Crop Insurance',
      benefitDescription:
        'Provides financial support to farmers suffering crop loss/damage due to unforeseen events ' +
        'like natural calamities, pests, and diseases.',
      applicableStates: [],  // All India
      eligibilitySummary:
        'All farmers growing notified crops in notified areas. Loanee farmers: compulsory. ' +
        'Non-loanee farmers: voluntary enrollment.',
      eligibilityDetails: [
        'All farmers — sharecroppers and tenant farmers are also eligible.',
        'Loanee farmers (those with crop loans): compulsory enrollment for notified crops.',
        'Non-loanee farmers: voluntary enrollment through bank/CSC/insurance company.',
        'Premium rates: up to 2% for Kharif crops, 1.5% for Rabi crops, 5% for annual commercial/horticulture crops.',
      ],
      exclusions: [
        'Crops not notified by the state government for the scheme.',
        'Areas not notified as covered under the scheme.',
      ],
      documentsRequired: [
        'Land records / Khasra',
        'Bank account details',
        'Crop sowing certificate (from patwari/village officer)',
        'Aadhaar card',
      ],
      officialUrl: 'https://pmfby.gov.in/',
      applicationUrl: 'https://pmfby.gov.in/',
      status: 'ACTIVE',
      sourceVerifiedAt: new Date('2026-10-30'),
      sourceVerifiedBy: 'Manually verified by Krishi Setu team from pmfby.gov.in on 2026-10-30',
      isActive: true,
    },
    {
      schemeCode: 'KCC',
      schemeName: 'Kisan Credit Card',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      department: 'NABARD / Commercial Banks / RRBs / Cooperative Banks',
      benefitType: 'Credit / Loan Facility',
      benefitDescription:
        'Provides short-term credit for crop cultivation, post-harvest expenses, and allied activities. ' +
        'Interest subvention reduces effective interest rate for timely repayment.',
      applicableStates: [],
      eligibilitySummary:
        'All farmers — individual and joint borrowers, self-help groups, and joint liability groups.',
      eligibilityDetails: [
        'All farmers who own/lease/cultivate land.',
        'Self-help groups and joint liability groups of farmers.',
        'Tenant farmers, oral lessees, and sharecroppers are eligible.',
        'Credit limit based on scale of finance, crop area, and post-harvest needs.',
      ],
      exclusions: [
        'Farmers with existing NPA (Non-Performing Asset) accounts may face restrictions.',
      ],
      documentsRequired: [
        'Identity proof (Aadhaar / Voter ID)',
        'Address proof',
        'Land records / tenancy documents',
        'Passport-size photograph',
      ],
      officialUrl: 'https://www.nabard.org/content.aspx?id=572&catid=23&mid=530',
      status: 'ACTIVE',
      sourceVerifiedAt: new Date('2026-10-30'),
      sourceVerifiedBy: 'Manually verified by Krishi Setu team from NABARD portal on 2026-10-30',
      isActive: true,
    },
  ]);
  console.log('Seeded 3 government schemes (PM-KISAN, PMFBY, KCC)');

  await mongoose.disconnect();
  console.log('\n✅  Seed complete. REMINDER: All price data is SYNTHETIC_DEMO — not official government data.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
