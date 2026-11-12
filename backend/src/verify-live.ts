import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import mongoose from 'mongoose';
import axios from 'axios';
import request from 'supertest';
import { createApp } from './app';
import { Crop } from './models/Crop';
import { Mandi } from './models/Mandi';
import { MandiPrice } from './models/MandiPrice';
import { GovernmentScheme } from './models/GovernmentScheme';
import { Village } from './models/Village';
import { WeatherRecord } from './models/WeatherRecord';
import { FarmTask } from './models/FarmTask';
import { Notification } from './models/Notification';
import { User } from './models/User';

interface TestResult {
  section: string;
  endpoint?: string;
  httpStatus?: number;
  dbOperation?: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  summary: string;
  details?: unknown;
}

const results: TestResult[] = [];

async function runLiveVerification() {
  console.log('================================================================');
  console.log('       KRISHI SETU — LIVE INTEGRATION VERIFICATION SUITE        ');
  console.log('================================================================\n');

  const app = createApp();
  const uri = process.env.MONGODB_URI;

  console.log(`[Config] MongoDB URI: ${uri ? uri.replace(/:([^@]+)@/, ':****@') : 'NOT SET'}`);
  console.log(`[Config] OGD API Key: ${process.env.OGD_API_KEY || 'NOT SET'}\n`);

  // ── 1. Database Connection & Collection Verification ───────────────────────
  console.log('--- 1. Testing MongoDB Connection & Collections ---');
  let isDbConnected = false;
  try {
    if (!uri) throw new Error('MONGODB_URI environment variable is missing.');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    isDbConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully.');

    const collections = await mongoose.connection.db?.listCollections().toArray() || [];
    const collNames = collections.map((c) => c.name);
    console.log(`[Database] Found ${collections.length} collections: ${collNames.join(', ')}`);

    const counts = {
      crops: await Crop.countDocuments(),
      mandis: await Mandi.countDocuments(),
      mandiprices: await MandiPrice.countDocuments(),
      governmentschemes: await GovernmentScheme.countDocuments(),
      villages: await Village.countDocuments(),
      weatherrecords: await WeatherRecord.countDocuments(),
      farmtasks: await FarmTask.countDocuments(),
      users: await User.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log('[Database] Record counts:', JSON.stringify(counts, null, 2));

    results.push({
      section: 'Database Connection & Counts',
      dbOperation: 'listCollections & countDocuments across all collections',
      status: 'PASS',
      summary: `MongoDB Atlas connected. Collections: ${collNames.length}. Crops: ${counts.crops}, Mandis: ${counts.mandis}, Prices: ${counts.mandiprices}, Schemes: ${counts.governmentschemes}, Villages: ${counts.villages}, Weather: ${counts.weatherrecords}, Tasks: ${counts.farmtasks}, Notifications: ${counts.notifications}`,
      details: counts,
    });
  } catch (err: any) {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    results.push({
      section: 'Database Connection',
      dbOperation: 'mongoose.connect',
      status: 'FAIL',
      summary: `Failed to connect to MongoDB Atlas: ${err.message}`,
    });
  }

  // ── 2. CRUD Verification on Live Database (Temporary Record) ───────────────
  console.log('\n--- 2. Testing Database CRUD Lifecycle (Temporary Record) ---');
  if (isDbConnected) {
    try {
      // Create
      const tempTask = await FarmTask.create({
        title: 'VERIFICATION_TEMP_TASK_DELETE_ME',
        category: 'GENERAL',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 86400000),
        completed: false,
        notes: 'Temporary diagnostic task for live integration verification',
      });
      console.log(`[CRUD: Insert] Inserted temporary task ID: ${tempTask._id}`);

      // Read
      const retrieved = await FarmTask.findById(tempTask._id);
      if (!retrieved || retrieved.title !== 'VERIFICATION_TEMP_TASK_DELETE_ME') {
        throw new Error('Failed to retrieve inserted record');
      }
      console.log('[CRUD: Retrieve] Retrieved task successfully');

      // Update
      const updated = await FarmTask.findByIdAndUpdate(
        tempTask._id,
        { $set: { completed: true, notes: 'Updated by live verification' } },
        { returnDocument: 'after' }
      );
      if (!updated?.completed || updated.notes !== 'Updated by live verification') {
        throw new Error('Failed to update record');
      }
      console.log('[CRUD: Update] Updated task successfully (completed=true)');

      // Delete
      await FarmTask.findByIdAndDelete(tempTask._id);
      const afterDelete = await FarmTask.findById(tempTask._id);
      if (afterDelete !== null) {
        throw new Error('Record still exists after deletion');
      }
      console.log('[CRUD: Delete] Verified deletion: Record cleanly deleted');

      results.push({
        section: 'CRUD Lifecycle Verification',
        dbOperation: 'Insert -> Retrieve -> Update -> Delete -> Confirm Deleted',
        status: 'PASS',
        summary: 'CRUD lifecycle verified on live MongoDB: Created temporary record, retrieved, modified, and safely deleted.',
      });
    } catch (crudErr: any) {
      console.error('❌ CRUD verification error:', crudErr.message);
      results.push({
        section: 'CRUD Lifecycle Verification',
        dbOperation: 'Insert/Retrieve/Update/Delete',
        status: 'FAIL',
        summary: `CRUD test failed: ${crudErr.message}`,
      });
    }
  }

  // ── 3. Live External Weather API (Open-Meteo) ──────────────────────────────
  console.log('\n--- 3. Testing Live External Weather API (Open-Meteo) ---');
  try {
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast';
    const weatherRes = await axios.get(weatherUrl, {
      params: {
        latitude: 26.8467,
        longitude: 80.9462,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation',
          'weather_code',
          'wind_speed_10m',
          'is_day',
        ].join(','),
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'et0_fao_evapotranspiration',
          'weathercode',
          'windspeed_10m_max',
        ].join(','),
        timezone: 'Asia/Kolkata',
        forecast_days: 3,
      },
      timeout: 10000,
    });

    const wData = weatherRes.data;
    console.log(`[Open-Meteo] HTTP ${weatherRes.status}`);
    console.log(`[Open-Meteo] Live Current Temperature: ${wData.current?.temperature_2m}°C, RH: ${wData.current?.relative_humidity_2m}%, Rain: ${wData.current?.precipitation}mm, Wind: ${wData.current?.wind_speed_10m} km/h`);
    console.log(`[Open-Meteo] Forecast Days Received: ${wData.daily?.time?.length}`);

    results.push({
      section: 'Live Weather Integration (Open-Meteo)',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      httpStatus: weatherRes.status,
      status: 'PASS',
      summary: `Live Open-Meteo API verified. Temp: ${wData.current?.temperature_2m}°C, Humidity: ${wData.current?.relative_humidity_2m}%, Precipitation: ${wData.current?.precipitation}mm, Wind: ${wData.current?.wind_speed_10m} km/h, Forecast: ${wData.daily?.time?.length} days.`,
      details: {
        current: wData.current,
        dailyDates: wData.daily?.time,
      },
    });
  } catch (wErr: any) {
    console.error('❌ Open-Meteo weather fetch error:', wErr.message);
    results.push({
      section: 'Live Weather Integration (Open-Meteo)',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      status: 'FAIL',
      summary: `Failed to fetch live weather: ${wErr.message}`,
    });
  }

  // ── 4. End-to-End API Routes Verification (Supertest against App) ─────────
  console.log('\n--- 4. Testing End-to-End Backend Module Endpoints ---');

  // Core: Health
  const healthRes = await request(app).get('/api/v1/health');
  results.push({
    section: 'System Health',
    endpoint: 'GET /api/v1/health',
    httpStatus: healthRes.status,
    status: healthRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `Status: ${healthRes.body.data?.status}, DB: ${healthRes.body.data?.database?.status}`,
  });

  // Core: Data Sources Status
  const dsRes = await request(app).get('/api/v1/data-sources/status');
  results.push({
    section: 'External Data Sources Register',
    endpoint: 'GET /api/v1/data-sources/status',
    httpStatus: dsRes.status,
    status: dsRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `Registered external sources: ${dsRes.body.data?.sources?.length || 0}`,
  });

  // Module 1: Crops
  const cropsRes = await request(app).get('/api/v1/crops?limit=5');
  results.push({
    section: 'Module 1: Reference Crops',
    endpoint: 'GET /api/v1/crops',
    httpStatus: cropsRes.status,
    dbOperation: 'Crop.find({ isActive: true })',
    status: cropsRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `Retrieved ${cropsRes.body.data?.length || 0} crops from DB. Total: ${cropsRes.body.pagination?.total ?? 'N/A'}`,
  });

  // Module 1: Mandis
  const mandisRes = await request(app).get('/api/v1/mandis?limit=5');
  results.push({
    section: 'Module 1: Reference Mandis',
    endpoint: 'GET /api/v1/mandis',
    httpStatus: mandisRes.status,
    dbOperation: 'Mandi.find({ isActive: true })',
    status: mandisRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `Retrieved ${mandisRes.body.data?.length || 0} mandis from DB. Total: ${mandisRes.body.pagination?.total ?? 'N/A'}`,
  });

  // Module 1: Mandi Prices & Provenance Verification
  const pricesRes = await request(app).get('/api/v1/prices?limit=5');
  const samplePrice = pricesRes.body.data?.[0];
  const priceDataType = samplePrice?.dataType || 'NONE_AVAILABLE';
  const isOfficial = priceDataType === 'OFFICIAL_OGD' || priceDataType === 'VERIFIED_LIVE';
  results.push({
    section: 'Module 1: Mandi Prices & Provenance',
    endpoint: 'GET /api/v1/prices',
    httpStatus: pricesRes.status,
    dbOperation: 'MandiPrice.find() populated with Mandi and Crop',
    status: pricesRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `Retrieved ${pricesRes.body.data?.length || 0} price records. Data Provenance: [${priceDataType}]. Real Government OGD verified: ${isOfficial ? 'YES' : 'NO (Synthetic/Demo data safely labelled)'}.`,
  });

  // Module 1: Smart Mandi Comparison
  let mandiCompStatus: 'PASS' | 'FAIL' = 'FAIL';
  let mandiCompSummary = 'No crops or mandis available to execute comparison';
  if (cropsRes.body.data?.length > 0 && mandisRes.body.data?.length > 0) {
    const cId = cropsRes.body.data[0]._id;
    const mId = mandisRes.body.data[0]._id;
    const compRes = await request(app)
      .post('/api/v1/mandi-comparison')
      .send({
        cropId: cId,
        quantityQuintals: 10,
        mandiEntries: [{ mandiId: mId, transportCostInr: 100, otherCostsInr: 0 }],
      });

    mandiCompStatus = compRes.status === 200 ? 'PASS' : 'FAIL';
    const singleResult = compRes.body.data?.mandis?.[0];
    mandiCompSummary = `HTTP ${compRes.status}: Crop: ${compRes.body.data?.cropName}, Net Realization: ₹${singleResult?.calculation?.estimatedNetRealizationInr ?? 'N/A'}, Status: ${singleResult?.calculation?.status ?? 'N/A'}, Provenance: ${singleResult?.price?.dataType ?? 'N/A'}`;
  }
  results.push({
    section: 'Module 1: Smart Mandi Decision Engine',
    endpoint: 'POST /api/v1/mandi-comparison',
    status: mandiCompStatus,
    summary: mandiCompSummary,
  });

  // Module 2: Crop Opportunity Assessment
  const cropAssRes = await request(app)
    .post('/api/v1/crop-assessments')
    .send({
      season: 'RABI',
      soilType: 'Loam', // Verified normalization
      waterAvailability: 'MEDIUM',
      state: 'Uttar Pradesh',
    });
  results.push({
    section: 'Module 2: Crop Opportunity Engine',
    endpoint: 'POST /api/v1/crop-assessments',
    httpStatus: cropAssRes.status,
    status: cropAssRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `HTTP ${cropAssRes.status}: Evaluated ${cropAssRes.body.data?.results?.length || 0} crops for Rabi/Loam conditions. Disclaimer present: ${Boolean(cropAssRes.body.data?.disclaimer)}`,
  });

  // Module 3: Climate Risk Engine via Backend Router
  const weatherRouteRes = await request(app).get('/api/v1/weather?latitude=26.8467&longitude=80.9462&days=3');
  results.push({
    section: 'Module 3: Climate Risk Engine',
    endpoint: 'GET /api/v1/weather',
    httpStatus: weatherRouteRes.status,
    dbOperation: 'WeatherRecord bulkWrite upsert & cache retrieval',
    status: weatherRouteRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `HTTP ${weatherRouteRes.status}: Live current temp: ${weatherRouteRes.body.data?.current?.temperatureC}°C, RH: ${weatherRouteRes.body.data?.current?.relativeHumidityPercent}%, Forecast days: ${weatherRouteRes.body.data?.forecastDays?.length || 0}, Active advisories: ${weatherRouteRes.body.data?.advisories?.length || 0}`,
  });

  // Module 4: Government Schemes Storage & Retrieval
  const schemesRes = await request(app).get('/api/v1/schemes');
  const schemeItems = schemesRes.body.data || [];
  results.push({
    section: 'Module 4: Government Support Engine',
    endpoint: 'GET /api/v1/schemes',
    httpStatus: schemesRes.status,
    dbOperation: 'GovernmentScheme.find({ isActive: true })',
    status: schemesRes.status === 200 ? 'PASS' : 'FAIL',
    summary: `HTTP ${schemesRes.status}: Retrieved ${schemeItems.length} official schemes stored in MongoDB. Sample scheme: "${schemeItems[0]?.schemeName || 'None'}" (${schemeItems[0]?.officialUrl || 'N/A'})`,
  });

  // Module 5: Village Dashboard Aggregation
  const villagesRes = await request(app).get('/api/v1/villages');
  let vDashStatus: 'PASS' | 'FAIL' = 'FAIL';
  let vDashSummary = 'No villages in DB';
  if (villagesRes.body.data?.length > 0) {
    const vId = villagesRes.body.data[0]._id;
    const vDashRes = await request(app).get(`/api/v1/villages/${vId}/dashboard`);
    vDashStatus = vDashRes.status === 200 ? 'PASS' : 'FAIL';
    vDashSummary = `HTTP ${vDashRes.status}: Village: ${vDashRes.body.data?.village?.name}, Weather Status: ${vDashRes.body.data?.weather?.status}, Mandis: ${vDashRes.body.data?.mandis?.mandis?.length || 0}, Schemes: ${vDashRes.body.data?.schemes?.applicableSchemes?.length || 0}`;
  }
  results.push({
    section: 'Module 5: Village Agriculture Dashboard',
    endpoint: 'GET /api/v1/villages/:id/dashboard',
    status: vDashStatus,
    summary: vDashSummary,
  });

  // Notifications: Live Persistence & Mark-As-Read
  console.log('\n--- 5. Testing Notifications Live Persistence & Mark-As-Read ---');
  let notifStatus: 'PASS' | 'FAIL' = 'FAIL';
  let notifSummary = '';
  try {
    // 1. Fetch initial notifications
    const nListRes = await request(app).get('/api/v1/notifications');
    const notifs = nListRes.body.data || [];

    // 2. Insert an unread notification directly to test persistence
    const testNotif = await Notification.create({
      category: 'WEATHER',
      severity: 'WARNING',
      title: 'LIVE_TEST_WEATHER_NOTIFICATION',
      message: 'Test notification to verify mark-as-read persistence across page refresh',
      link: 'weather',
      isRead: false,
    });

    // 3. Mark it as read via API
    const readRes = await request(app).patch(`/api/v1/notifications/${testNotif._id}/read`);

    // 4. Query again to simulate browser refresh
    const refreshed = await Notification.findById(testNotif._id);
    const persisted = refreshed?.isRead === true;

    // Clean up test notification
    await Notification.findByIdAndDelete(testNotif._id);

    notifStatus = persisted && readRes.status === 200 ? 'PASS' : 'FAIL';
    notifSummary = `Initial notifications count: ${notifs.length}. Created unread test notification ID: ${testNotif._id}. PATCH /notifications/${testNotif._id}/read returned HTTP ${readRes.status}. After simulated reload, isRead=${refreshed?.isRead} (readAt=${refreshed?.readAt?.toISOString()}). Persistence verified.`;
  } catch (nErr: any) {
    notifStatus = 'FAIL';
    notifSummary = `Notification test failed: ${nErr.message}`;
  }

  results.push({
    section: 'Notification Center Persistence',
    endpoint: 'GET /api/v1/notifications & PATCH /api/v1/notifications/:id/read',
    status: notifStatus,
    summary: notifSummary,
  });

  // Disconnect cleanly
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log('                 LIVE VERIFICATION SUMMARY TABLE                ');
  console.log('================================================================');
  console.table(
    results.map((r) => ({
      Section: r.section,
      Endpoint: r.endpoint || 'N/A',
      Status: r.status,
      Summary: r.summary.substring(0, 95) + (r.summary.length > 95 ? '...' : ''),
    }))
  );

  console.log('\nFULL_JSON_RESULTS_START');
  console.log(JSON.stringify(results, null, 2));
  console.log('FULL_JSON_RESULTS_END');
}

runLiveVerification().catch((e) => {
  console.error('Fatal verification runner error:', e);
  process.exit(1);
});
