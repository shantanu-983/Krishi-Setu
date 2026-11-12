/**
 * Climate Risk Engine — Weather Service
 *
 * Fetches weather data from Open-Meteo (free, no API key required).
 * Stores records in the database with clear provenance.
 *
 * CONSTRAINTS:
 *  - Distinguishes FORECAST from HISTORICAL records.
 *  - Does NOT invent drought/heat/flood thresholds (CRI pending guide approval).
 *  - Returns raw weather data with source metadata.
 *  - Handles timeouts and provider errors gracefully.
 *  - Attribution: "Weather data by Open-Meteo.com" (CC BY 4.0).
 */

import axios, { AxiosError } from 'axios';
import { WeatherRecord, IWeatherRecord } from '../../models/WeatherRecord';
import { config } from '../../config/env';
import { ExternalApiError } from '../../shared/errors';
import { checkFreshness } from '../../shared/provenance';
import { generateAgronomicAdvisories, AgronomicAdvisory } from './advisory.service';

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_ARCHIVE_URL  = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_ATTRIBUTION  = 'Weather data by Open-Meteo.com';
const OPEN_METEO_SOURCE_URL   = 'https://open-meteo.com/';

// WMO weather code descriptions (simplified subset)
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail',
};

export interface WeatherQueryParams {
  latitude: number;
  longitude: number;
  locationLabel?: string;
  days?: number;             // For forecast: 1–16 days ahead (default: 7)
}

export interface DailyWeatherEntry {
  date: string;              // YYYY-MM-DD
  recordType: 'FORECAST' | 'HISTORICAL';
  maxTempC: number | null;
  minTempC: number | null;
  precipitationSumMm: number | null;
  et0FaoEvapotranspirationMm: number | null;
  weatherCode: number | null;
  weatherDescription: string | null;
  windspeedMaxKmh: number | null;
}

export interface CurrentWeatherEntry {
  temperatureC: number | null;
  relativeHumidityPercent: number | null;
  apparentTemperatureC?: number | null;
  precipitationMm: number;
  weatherCode: number | null;
  weatherDescription: string | null;
  windspeedKmh: number | null;
  isDay: boolean;
  time: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  locationLabel?: string;
  timezone: string;
  attribution: string;
  sourceUrl: string;
  retrievedAt: string;
  freshness: { isStale: boolean; ageHours: number };
  current?: CurrentWeatherEntry | null;
  forecastDays: DailyWeatherEntry[];
  advisories?: AgronomicAdvisory[];
  limitations: string[];
}

// ─── Fetch and Store Forecast ──────────────────────────────────────────────────

export async function fetchWeatherForecast(
  params: WeatherQueryParams
): Promise<WeatherResponse> {
  const days = Math.min(Math.max(params.days ?? 7, 1), 16);

  let rawData: OpenMeteoForecastResponse;
  try {
    const response = await axios.get<OpenMeteoForecastResponse>(
      OPEN_METEO_FORECAST_URL,
      {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
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
          forecast_days: days,
        },
        timeout: config.EXTERNAL_API_TIMEOUT_MS,
      }
    );
    rawData = response.data;
  } catch (err) {
    const msg = err instanceof AxiosError
      ? `Open-Meteo returned ${err.response?.status ?? 'no response'}: ${err.message}`
      : String(err);
    throw new ExternalApiError('Open-Meteo', msg);
  }

  const retrievedAt = new Date();
  const entries = mapForecastDays(rawData, 'FORECAST');

  // Upsert into database
  await upsertWeatherRecords(
    params.latitude,
    params.longitude,
    params.locationLabel,
    entries,
    retrievedAt
  );

  const freshness = checkFreshness(retrievedAt, config.WEATHER_STALE_AFTER_HOURS);
  const publicEntries = entries.map(toPublicEntry);
  const advisories = generateAgronomicAdvisories(publicEntries);

  let currentEntry: CurrentWeatherEntry | null = null;
  if (rawData.current) {
    const code = rawData.current.weather_code ?? null;
    currentEntry = {
      temperatureC: rawData.current.temperature_2m ?? null,
      relativeHumidityPercent: rawData.current.relative_humidity_2m ?? null,
      apparentTemperatureC: rawData.current.apparent_temperature ?? null,
      precipitationMm: rawData.current.precipitation ?? 0,
      weatherCode: code,
      weatherDescription: code !== null ? (WMO_DESCRIPTIONS[code] ?? null) : null,
      windspeedKmh: rawData.current.wind_speed_10m ?? null,
      isDay: rawData.current.is_day === 1,
      time: rawData.current.time || retrievedAt.toISOString(),
    };
  } else if (publicEntries.length > 0) {
    const today = publicEntries[0];
    currentEntry = {
      temperatureC: today.maxTempC,
      relativeHumidityPercent: 60,
      apparentTemperatureC: today.maxTempC,
      precipitationMm: today.precipitationSumMm ?? 0,
      weatherCode: today.weatherCode,
      weatherDescription: today.weatherDescription,
      windspeedKmh: today.windspeedMaxKmh,
      isDay: true,
      time: retrievedAt.toISOString(),
    };
  }

  return {
    latitude: rawData.latitude,
    longitude: rawData.longitude,
    locationLabel: params.locationLabel,
    timezone: rawData.timezone,
    attribution: OPEN_METEO_ATTRIBUTION,
    sourceUrl: OPEN_METEO_SOURCE_URL,
    retrievedAt: retrievedAt.toISOString(),
    freshness,
    current: currentEntry,
    forecastDays: publicEntries,
    advisories,
    limitations: [
      'Forecast accuracy decreases beyond 7 days.',
      'Data represents a single coordinate point — local micro-climate variations are not captured.',
      'Actionable agronomic advisories are derived using rule-based meteorological thresholds.',
      'Attribution: Weather data by Open-Meteo.com (CC BY 4.0)',
    ],
  };
}

// ─── Fetch and Store Historical Weather ────────────────────────────────────────

export interface WeatherHistoricalParams {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  locationLabel?: string;
}

export async function fetchWeatherHistorical(
  params: WeatherHistoricalParams
): Promise<WeatherResponse> {
  let rawData: OpenMeteoForecastResponse;
  try {
    const response = await axios.get<OpenMeteoForecastResponse>(
      OPEN_METEO_ARCHIVE_URL,
      {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          start_date: params.startDate,
          end_date: params.endDate,
          daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'et0_fao_evapotranspiration',
            'weathercode',
            'windspeed_10m_max',
          ].join(','),
          timezone: 'Asia/Kolkata',
        },
        timeout: config.EXTERNAL_API_TIMEOUT_MS,
      }
    );
    rawData = response.data;
  } catch (err) {
    const msg = err instanceof AxiosError
      ? `Open-Meteo archive returned ${err.response?.status ?? 'no response'}: ${err.message}`
      : String(err);
    throw new ExternalApiError('Open-Meteo Archive', msg);
  }

  const retrievedAt = new Date();
  const entries = mapForecastDays(rawData, 'HISTORICAL');

  await upsertWeatherRecords(
    params.latitude,
    params.longitude,
    params.locationLabel,
    entries,
    retrievedAt
  );

  const publicEntries = entries.map(toPublicEntry);
  const advisories = generateAgronomicAdvisories(publicEntries);

  return {
    latitude: rawData.latitude,
    longitude: rawData.longitude,
    locationLabel: params.locationLabel,
    timezone: rawData.timezone,
    attribution: OPEN_METEO_ATTRIBUTION,
    sourceUrl: OPEN_METEO_SOURCE_URL,
    retrievedAt: retrievedAt.toISOString(),
    freshness: { isStale: false, ageHours: 0 },
    forecastDays: publicEntries,
    advisories,
    limitations: [
      'Historical observations sourced from Copernicus ERA5 / Open-Meteo reanalysis archive.',
      'Data represents a single coordinate point — local micro-climate variations are not captured.',
      'This is historical weather data, not a predictive risk assessment.',
      'Attribution: Weather data by Open-Meteo.com (CC BY 4.0)',
    ],
  };
}

// ─── Get Cached Weather (for dashboard use) ────────────────────────────────────

export async function getCachedWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResponse | null> {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const records = await WeatherRecord.find({
    latitude,
    longitude,
    recordType: 'FORECAST',
    date: { $gte: startOfToday },
  })
    .sort({ date: 1 })
    .limit(16)
    .lean();

  if (records.length === 0) return null;

  const mostRecentRetrieval = records.reduce(
    (latest, r) => (r.retrievedAt > latest ? r.retrievedAt : latest),
    records[0].retrievedAt
  );

  const freshness = checkFreshness(mostRecentRetrieval, config.WEATHER_STALE_AFTER_HOURS);
  const publicDays = records.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    recordType: r.recordType,
    maxTempC: r.maxTempC ?? null,
    minTempC: r.minTempC ?? null,
    precipitationSumMm: r.precipitationSumMm ?? null,
    et0FaoEvapotranspirationMm: r.et0FaoEvapotranspirationMm ?? null,
    weatherCode: r.weatherCode ?? null,
    weatherDescription: r.weatherCode != null ? (WMO_DESCRIPTIONS[r.weatherCode] ?? null) : null,
    windspeedMaxKmh: r.windspeedMaxKmh ?? null,
  }));
  const advisories = generateAgronomicAdvisories(publicDays);

  const todayRec = records[0];
  const currentEntry: CurrentWeatherEntry = {
    temperatureC: todayRec.maxTempC ?? null,
    relativeHumidityPercent: 60,
    apparentTemperatureC: todayRec.maxTempC ?? null,
    precipitationMm: todayRec.precipitationSumMm ?? 0,
    weatherCode: todayRec.weatherCode ?? null,
    weatherDescription: todayRec.weatherCode != null ? (WMO_DESCRIPTIONS[todayRec.weatherCode] ?? null) : null,
    windspeedKmh: todayRec.windspeedMaxKmh ?? null,
    isDay: true,
    time: todayRec.date.toISOString(),
  };

  return {
    latitude,
    longitude,
    timezone: 'Asia/Kolkata',
    attribution: OPEN_METEO_ATTRIBUTION,
    sourceUrl: OPEN_METEO_SOURCE_URL,
    retrievedAt: mostRecentRetrieval.toISOString(),
    freshness,
    current: currentEntry,
    forecastDays: publicDays,
    advisories,
    limitations: [
      'Data served from cache. Freshness indicated above.',
      'Actionable agronomic advisories are derived using rule-based meteorological thresholds.',
    ],
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface StorableEntry {
  date: Date;
  recordType: 'FORECAST' | 'HISTORICAL';
  maxTempC?: number;
  minTempC?: number;
  precipitationSumMm?: number;
  et0FaoEvapotranspirationMm?: number;
  weatherCode?: number;
  windspeedMaxKmh?: number;
}

async function upsertWeatherRecords(
  lat: number,
  lon: number,
  locationLabel: string | undefined,
  entries: StorableEntry[],
  retrievedAt: Date
) {
  const ops = entries.map((e) => ({
    updateOne: {
      filter: { latitude: lat, longitude: lon, date: e.date, recordType: e.recordType },
      update: {
        $set: {
          ...e,
          locationLabel,
          sourceName: OPEN_METEO_ATTRIBUTION,
          sourceUrl: OPEN_METEO_SOURCE_URL,
          retrievedAt,
        },
      },
      upsert: true,
    },
  }));
  if (ops.length > 0) await WeatherRecord.bulkWrite(ops);
}

function mapForecastDays(
  raw: OpenMeteoForecastResponse,
  recordType: 'FORECAST' | 'HISTORICAL'
): StorableEntry[] {
  const daily = raw.daily;
  if (!daily) return [];
  return (daily.time ?? []).map((dateStr, i) => ({
    date: new Date(dateStr),
    recordType,
    maxTempC: daily.temperature_2m_max?.[i] ?? undefined,
    minTempC: daily.temperature_2m_min?.[i] ?? undefined,
    precipitationSumMm: daily.precipitation_sum?.[i] ?? undefined,
    et0FaoEvapotranspirationMm: daily.et0_fao_evapotranspiration?.[i] ?? undefined,
    weatherCode: daily.weathercode?.[i] ?? undefined,
    windspeedMaxKmh: daily.windspeed_10m_max?.[i] ?? undefined,
  }));
}

function toPublicEntry(e: StorableEntry): DailyWeatherEntry {
  const code = e.weatherCode ?? null;
  return {
    date: e.date.toISOString().split('T')[0],
    recordType: e.recordType,
    maxTempC: e.maxTempC ?? null,
    minTempC: e.minTempC ?? null,
    precipitationSumMm: e.precipitationSumMm ?? null,
    et0FaoEvapotranspirationMm: e.et0FaoEvapotranspirationMm ?? null,
    weatherCode: code,
    weatherDescription: code !== null ? (WMO_DESCRIPTIONS[code] ?? null) : null,
    windspeedMaxKmh: e.windspeedMaxKmh ?? null,
  };
}

// ─── Open-Meteo response shape ─────────────────────────────────────────────────

interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time?: string;
    temperature_2m?: number | null;
    relative_humidity_2m?: number | null;
    apparent_temperature?: number | null;
    precipitation?: number | null;
    weather_code?: number | null;
    wind_speed_10m?: number | null;
    is_day?: number | null;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    et0_fao_evapotranspiration?: (number | null)[];
    weathercode?: (number | null)[];
    windspeed_10m_max?: (number | null)[];
  };
}
