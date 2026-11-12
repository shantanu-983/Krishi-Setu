import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchWeatherForecast, fetchWeatherHistorical, getCachedWeather } from '../modules/weather/weather.service';
import { WeatherRecord } from '../models/WeatherRecord';
import { ExternalApiError } from '../shared/errors';

vi.mock('axios');

describe('Climate Risk Engine — Weather Service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await WeatherRecord.deleteMany({});
  });

  it('successfully fetches and stores Open-Meteo forecast data with provenance', async () => {
    const mockApiResponse = {
      data: {
        latitude: 23.25,
        longitude: 77.41,
        timezone: 'Asia/Kolkata',
        daily: {
          time: ['2026-11-01', '2026-11-02'],
          temperature_2m_max: [31.5, 30.8],
          temperature_2m_min: [18.2, 17.5],
          precipitation_sum: [0.0, 2.4],
          et0_fao_evapotranspiration: [4.2, 3.8],
          weathercode: [1, 61],
          windspeed_10m_max: [12.5, 15.0],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockApiResponse);

    const result = await fetchWeatherForecast({
      latitude: 23.25,
      longitude: 77.41,
      locationLabel: 'Bhopal Central',
      days: 2,
    });

    expect(result.latitude).toBe(23.25);
    expect(result.longitude).toBe(77.41);
    expect(result.attribution).toContain('Open-Meteo.com');
    expect(result.forecastDays).toHaveLength(2);
    expect(result.forecastDays[0].maxTempC).toBe(31.5);
    expect(result.forecastDays[0].recordType).toBe('FORECAST');
    expect(result.forecastDays[1].weatherDescription).toBe('Slight rain');

    // Verify stored in DB
    const records = await WeatherRecord.find({ latitude: 23.25, longitude: 77.41 });
    expect(records).toHaveLength(2);
    expect(records[0].recordType).toBe('FORECAST');
  });

  it('successfully fetches and stores historical weather data (ERA5)', async () => {
    const mockApiResponse = {
      data: {
        latitude: 22.72,
        longitude: 75.86,
        timezone: 'Asia/Kolkata',
        daily: {
          time: ['2026-10-01'],
          temperature_2m_max: [32.0],
          temperature_2m_min: [20.0],
          precipitation_sum: [0.0],
          et0_fao_evapotranspiration: [4.5],
          weathercode: [0],
          windspeed_10m_max: [10.0],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockApiResponse);

    const result = await fetchWeatherHistorical({
      latitude: 22.72,
      longitude: 75.86,
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      locationLabel: 'Indore',
    });

    expect(result.forecastDays[0].recordType).toBe('HISTORICAL');
    expect(result.forecastDays[0].weatherDescription).toBe('Clear sky');

    const dbRecord = await WeatherRecord.findOne({
      latitude: 22.72,
      recordType: 'HISTORICAL',
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.recordType).toBe('HISTORICAL');
  });

  it('handles external API network error gracefully with ExternalApiError', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Connection timed out'));

    await expect(
      fetchWeatherForecast({
        latitude: 23.25,
        longitude: 77.41,
      })
    ).rejects.toThrow(ExternalApiError);
  });

  it('retrieves cached weather when available and reports freshness', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    await WeatherRecord.create({
      latitude: 23.25,
      longitude: 77.41,
      recordType: 'FORECAST',
      date: futureDate,
      maxTempC: 30,
      minTempC: 18,
      sourceName: 'Weather data by Open-Meteo.com',
      sourceUrl: 'https://open-meteo.com/',
      retrievedAt: new Date(),
    });

    const cached = await getCachedWeather(23.25, 77.41);
    expect(cached).not.toBeNull();
    expect(cached?.forecastDays).toHaveLength(1);
    expect(cached?.forecastDays[0].maxTempC).toBe(30);
    expect(cached?.freshness.isStale).toBe(false);
  });

  it('generates actionable agronomic advisories when thresholds are breached', async () => {
    const mockApiResponse = {
      data: {
        latitude: 23.25,
        longitude: 77.41,
        timezone: 'Asia/Kolkata',
        daily: {
          time: ['2026-11-01', '2026-11-02'],
          temperature_2m_max: [38.5, 31.0], // Day 1 triggers ADV-HEAT-01
          temperature_2m_min: [22.0, 18.0],
          precipitation_sum: [0.0, 42.0],  // Day 2 triggers ADV-RAIN-01
          et0_fao_evapotranspiration: [5.2, 2.5],
          weathercode: [0, 65],
          windspeed_10m_max: [24.0, 10.0], // Day 1 triggers ADV-WIND-01
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockApiResponse);

    const result = await fetchWeatherForecast({
      latitude: 23.25,
      longitude: 77.41,
      days: 2,
    });

    expect(result.advisories).toBeDefined();
    expect(result.advisories?.length).toBeGreaterThanOrEqual(3);

    const ids = result.advisories?.map((a) => a.id);
    expect(ids).toContain('ADV-HEAT-01');
    expect(ids).toContain('ADV-RAIN-01');
    expect(ids).toContain('ADV-WIND-01');

    const heatAdv = result.advisories?.find((a) => a.id === 'ADV-HEAT-01');
    expect(heatAdv?.actionableAdvice).toMatch(/irrigation/i);
    expect(heatAdv?.applicableDates).toContain('2026-11-01');
  });

  it('returns null when no cached records exist', async () => {
    const cached = await getCachedWeather(10.0, 10.0);
    expect(cached).toBeNull();
  });

  it('populates live current weather conditions when returned by Open-Meteo', async () => {
    const mockApiResponse = {
      data: {
        latitude: 26.85,
        longitude: 80.95,
        timezone: 'Asia/Kolkata',
        current: {
          time: '2026-11-09T18:00',
          temperature_2m: 25.4,
          relative_humidity_2m: 62,
          apparent_temperature: 26.0,
          precipitation: 0.0,
          weather_code: 1,
          wind_speed_10m: 8.5,
          is_day: 0,
        },
        daily: {
          time: ['2026-11-09'],
          temperature_2m_max: [28.0],
          temperature_2m_min: [16.0],
          precipitation_sum: [0.0],
          et0_fao_evapotranspiration: [3.9],
          weathercode: [1],
          windspeed_10m_max: [8.5],
        },
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockApiResponse);

    const result = await fetchWeatherForecast({
      latitude: 26.85,
      longitude: 80.95,
      days: 1,
    });

    expect(result.current).toBeDefined();
    expect(result.current?.temperatureC).toBe(25.4);
    expect(result.current?.relativeHumidityPercent).toBe(62);
    expect(result.current?.windspeedKmh).toBe(8.5);
    expect(result.current?.weatherDescription).toBe('Mainly clear');
    expect(result.current?.isDay).toBe(false);
  });
});
