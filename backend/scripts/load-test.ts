/**
 * Krishi Setu — 100 Concurrent User Load Test & Benchmarking Script
 *
 * Simulates 100 simultaneous concurrent users executing full multi-step
 * agricultural decision workflows across all five engines and authentication.
 *
 * Metrics recorded:
 *  - Requests per second (RPS)
 *  - Success / Error rates
 *  - Latency percentiles: p50 (median), p95, p99, min, max
 */

import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { Village } from '../src/models/Village';
import { Crop } from '../src/models/Crop';
import { Mandi } from '../src/models/Mandi';
import { MandiPrice } from '../src/models/MandiPrice';
import { GovernmentScheme } from '../src/models/GovernmentScheme';
import { WeatherRecord } from '../src/models/WeatherRecord';

interface LatencyRecord {
  endpoint: string;
  durationMs: number;
  status: number;
  ok: boolean;
}

const TOTAL_CONCURRENT_USERS = 100;
const TEST_PORT = 3199;

async function httpRequest(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; durationMs: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData).toString();

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          const durationMs = Date.now() - startTime;
          try {
            const data = JSON.parse(raw);
            resolve({ status: res.statusCode || 0, durationMs, data });
          } catch {
            resolve({ status: res.statusCode || 0, durationMs, data: raw });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function seedTestData() {
  const crop = await Crop.create({
    name: 'Wheat',
    category: 'CEREAL',
    seasons: ['RABI'],
    conditions: { phMin: 6.0, phMax: 7.5, waterRequirementMmMin: 400, waterRequirementMmMax: 650 },
    conditionsVerified: true,
    isActive: true,
  });

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
    modalPriceInr: 2275,
    unit: 'quintal',
    dataType: 'SYNTHETIC_DEMO',
    sourceName: 'Krishi Setu Pilot Benchmark Fixture',
    retrievedAt: new Date(),
  });

  const village = await Village.create({
    name: 'Sanwer Pilot Village',
    district: 'Indore',
    state: 'Madhya Pradesh',
    latitude: 22.9694,
    longitude: 75.8309,
    coordinatesVerified: true,
    isActive: true,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await WeatherRecord.create({
    latitude: 22.9694,
    longitude: 75.8309,
    recordType: 'FORECAST',
    date: tomorrow,
    maxTempC: 31.0,
    minTempC: 19.5,
    precipitationSumMm: 0,
    et0FaoEvapotranspirationMm: 4.1,
    weatherCode: 1,
    windspeedMaxKmh: 12.0,
    sourceName: 'Weather data by Open-Meteo.com',
    sourceUrl: 'https://open-meteo.com/',
    retrievedAt: new Date(),
  });

  await GovernmentScheme.create({
    schemeCode: 'PM-KISAN',
    schemeName: 'Pradhan Mantri Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture',
    benefitType: 'Direct Benefit Transfer',
    benefitDescription: '₹6,000 per year',
    applicableStates: [],
    eligibilitySummary: 'Landholding farmer families',
    eligibilityDetails: [],
    exclusions: [],
    officialUrl: 'https://pmkisan.gov.in',
    status: 'ACTIVE',
    isActive: true,
  });

  return {
    cropId: String(crop._id),
    mandiId: String(mandi._id),
    villageId: String(village._id),
  };
}

async function runVirtualUser(
  userIdx: number,
  context: { cropId: string; mandiId: string; villageId: string }
): Promise<LatencyRecord[]> {
  const records: LatencyRecord[] = [];

  async function track(endpoint: string, fn: () => Promise<{ status: number }>) {
    const t0 = Date.now();
    try {
      const res = await fn();
      const durationMs = Date.now() - t0;
      const ok = res.status >= 200 && res.status < 300;
      if (!ok) {
        console.warn(`[WARN] ${endpoint} returned ${res.status}:`, (res as any).data);
      }
      records.push({
        endpoint,
        durationMs,
        status: res.status,
        ok,
      });
    } catch (err: any) {
      console.error(`[ERR] ${endpoint} threw:`, err.message);
      records.push({
        endpoint,
        durationMs: Date.now() - t0,
        status: 0,
        ok: false,
      });
    }
  }

  // 1. Health check
  await track('GET /health', () => httpRequest('GET', '/api/v1/health'));

  // 2. Load pilot villages
  await track('GET /villages', () => httpRequest('GET', '/api/v1/villages'));

  // 3. Multi-Engine Village Dashboard
  await track('GET /villages/:id/dashboard', () =>
    httpRequest('GET', `/api/v1/villages/${context.villageId}/dashboard`)
  );

  // 4. Smart Mandi Net Realization Comparison
  await track('POST /mandi-comparison', () =>
    httpRequest('POST', '/api/v1/mandi-comparison', {
      cropId: context.cropId,
      quantityQuintals: 15,
      mandiEntries: [
        {
          mandiId: context.mandiId,
          transportCostInr: 600,
          otherCostsInr: 150,
        },
      ],
    })
  );

  // 5. Crop Opportunity Engine Suitability Assessment
  await track('POST /crop-assessments', () =>
    httpRequest('POST', '/api/v1/crop-assessments', {
      season: 'RABI',
      soilType: 'Black Cotton',
      soilPh: 6.8,
      annualRainfallMm: 650,
      waterAvailability: 'HIGH',
      state: 'Madhya Pradesh',
    })
  );

  // 6. Government Schemes
  await track('GET /schemes', () =>
    httpRequest('GET', '/api/v1/schemes?state=Madhya+Pradesh')
  );

  // 7. OGD Mandi Status & Safe Diagnostics
  await track('GET /mandi/ogd-status', () =>
    httpRequest('GET', '/api/v1/mandi/ogd-status')
  );

  // 8. Farmer User Registration & Authentication Flow
  const phone = `98${String(10000000 + userIdx).padStart(8, '0')}`;
  await track('POST /auth/register', () =>
    httpRequest('POST', '/api/v1/auth/register', {
      name: `Benchmark Farmer ${userIdx}`,
      phone,
      password: 'benchmarkPassword123',
      role: 'farmer',
      state: 'Madhya Pradesh',
      district: 'Indore',
      farmSizeAcres: 4.5,
      primaryCrops: ['Wheat', 'Soybean'],
    })
  );

  return records;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function main() {
  console.log('================================================================');
  console.log('   KRISHI SETU — 100 CONCURRENT USER LOAD TEST BENCHMARK        ');
  console.log('================================================================');
  console.log(`Starting in-memory database and test server on port ${TEST_PORT}...`);

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  const app = createApp();
  const server = app.listen(TEST_PORT, '127.0.0.1');

  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  console.log(`Test server running at http://127.0.0.1:${TEST_PORT}/api/v1`);

  const context = await seedTestData();
  console.log('Seed data initialized successfully.');

  console.log(`\nLaunching ${TOTAL_CONCURRENT_USERS} concurrent virtual user workflows...`);
  const benchmarkStart = Date.now();

  const userPromises: Promise<LatencyRecord[]>[] = [];
  for (let i = 0; i < TOTAL_CONCURRENT_USERS; i++) {
    userPromises.push(runVirtualUser(i + 1, context));
  }

  const results = await Promise.all(userPromises);
  const totalElapsedMs = Date.now() - benchmarkStart;
  const totalElapsedSec = totalElapsedMs / 1000;

  const allRecords = results.flat();
  const totalRequests = allRecords.length;
  const successfulRequests = allRecords.filter((r) => r.ok).length;
  const failedRequests = totalRequests - successfulRequests;
  const rps = totalRequests / totalElapsedSec;

  const latencies = allRecords.map((r) => r.durationMs);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log('\n================================================================');
  console.log('                      BENCHMARK RESULTS                         ');
  console.log('================================================================');
  console.log(`Concurrent Virtual Users:     ${TOTAL_CONCURRENT_USERS}`);
  console.log(`Total Requests Executed:      ${totalRequests}`);
  console.log(`Total Elapsed Time:           ${totalElapsedSec.toFixed(2)} seconds`);
  console.log(`Effective Throughput:         ${rps.toFixed(2)} req/sec (RPS)`);
  console.log(`Successful Requests:          ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed Requests:              ${failedRequests}`);
  console.log('----------------------------------------------------------------');
  console.log('LATENCY DISTRIBUTION:');
  console.log(`  Min Latency:                ${minLatency} ms`);
  console.log(`  Average Latency:            ${avgLatency.toFixed(2)} ms`);
  console.log(`  Median Latency (p50):       ${p50} ms`);
  console.log(`  95th Percentile (p95):      ${p95} ms`);
  console.log(`  99th Percentile (p99):      ${p99} ms`);
  console.log(`  Max Latency:                ${maxLatency} ms`);
  console.log('----------------------------------------------------------------');

  // Breakdown by endpoint
  const endpointMap = new Map<string, number[]>();
  for (const r of allRecords) {
    if (!endpointMap.has(r.endpoint)) endpointMap.set(r.endpoint, []);
    endpointMap.get(r.endpoint)!.push(r.durationMs);
  }

  console.log('ENDPOINT BREAKDOWN (Calls, p50, p95, Max):');
  for (const [ep, times] of endpointMap.entries()) {
    console.log(
      `  ${ep.padEnd(30)}: n=${String(times.length).padStart(3)} | p50=${String(percentile(times, 50)).padStart(3)}ms | p95=${String(percentile(times, 95)).padStart(3)}ms | max=${String(Math.max(...times)).padStart(3)}ms`
    );
  }
  console.log('================================================================\n');

  // Teardown
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
