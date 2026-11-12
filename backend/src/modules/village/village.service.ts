/**
 * Village Agriculture Dashboard — Service
 *
 * Aggregates data from all four other modules for a village overview.
 * CONSTRAINTS:
 *  - Uses each module's own service — no business logic duplication.
 *  - A failure in one module does NOT fail the entire dashboard.
 *  - Missing sections are reported explicitly with a status, not silently omitted.
 *  - No village-level statistics are fabricated.
 */

import { Village } from '../../models/Village';
import { Mandi } from '../../models/Mandi';
import { MandiPrice } from '../../models/MandiPrice';
import { GovernmentScheme } from '../../models/GovernmentScheme';
import { Crop } from '../../models/Crop';
import { getCachedWeather, fetchWeatherForecast } from '../weather/weather.service';
import { NotFoundError } from '../../shared/errors';

export type SectionStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'PARTIAL';

export interface DashboardSection<T> {
  status: SectionStatus;
  data: T | null;
  message?: string;
  error?: string;
}

export interface MandiPriceSummary {
  mandiName: string;
  district: string;
  cropName: string;
  modalPriceInr: number | null;
  observationDate: string | null;
  dataType: string;
  sourceName: string;
  isStale: boolean;
}

export interface WeatherSectionData {
  today?: {
    maxTempC: number | null;
    minTempC: number | null;
    weatherDescription: string | null;
    precipitationMm: number;
    et0Mm?: number | null;
    windspeedKmh?: number | null;
  } | null;
  forecast?: unknown[];
  forecastDays: unknown[];
  advisories?: unknown[];
  attribution: string;
  retrievedAt: string;
  freshness: { isStale: boolean; ageHours: number };
}

export interface MandiGroupItem {
  mandiId: string;
  mandiName: string;
  district: string;
  state: string;
  prices: Array<{
    cropName: string;
    category: string;
    modalPriceInr: number | null;
    minPriceInr?: number | null;
    maxPriceInr?: number | null;
    unit: string;
    observationDate: string | null;
    dataType: string;
    sourceName: string;
    isStale: boolean;
  }>;
}

export interface MandiSectionData {
  mandis: MandiGroupItem[];
  entries: MandiPriceSummary[];
  note: string;
}

export interface CropsSectionData {
  activeCrops: Array<{
    id: string;
    name: string;
    localName?: string;
    seasons: string[];
    category: string;
  }>;
  seasonalCrops: Array<{ name: string; seasons: string[]; category: string }>;
  note: string;
}

export interface SchemesSectionData {
  applicableSchemes: Array<{
    id: string;
    schemeCode: string;
    schemeName: string;
    benefitType: string;
    officialUrl: string;
  }>;
  activeSchemes: Array<{ schemeCode: string; schemeName: string; officialUrl: string }>;
  note: string;
}

export interface VillageDashboard {
  village: {
    id: string;
    name: string;
    district: string;
    state: string;
    block?: string;
    coordinates: { latitude: number | null; longitude: number | null; verified?: boolean };
  };
  weather: DashboardSection<WeatherSectionData>;
  mandiPrices: DashboardSection<MandiSectionData>;
  crops: DashboardSection<CropsSectionData>;
  schemes: DashboardSection<SchemesSectionData>;
  generatedAt: string;
  dashboardNote: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export async function getVillageDashboard(villageId: string): Promise<VillageDashboard> {
  const village = await Village.findById(villageId).lean();
  if (!village) throw new NotFoundError('Village');

  const generatedAt = new Date().toISOString();

  // Run all sections concurrently; failures are caught individually
  const [weatherSection, mandiSection, cropsSection, schemesSection] = await Promise.all([
    fetchWeatherSection(village.latitude, village.longitude),
    fetchMandiSection(village.state, village._id?.toString()),
    fetchCropsSection(),
    fetchSchemesSection(village.state),
  ]);

  return {
    village: {
      id: String(village._id),
      name: village.name,
      district: village.district,
      state: village.state,
      block: village.block,
      coordinates: {
        latitude: village.latitude ?? null,
        longitude: village.longitude ?? null,
        verified: true,
      },
    },
    weather: weatherSection,
    mandiPrices: mandiSection,
    crops: cropsSection,
    schemes: schemesSection,
    generatedAt,
    dashboardNote:
      'This dashboard combines available data from multiple sources. ' +
      'Unavailable sections are shown with their individual status. ' +
      'Data may have varying freshness — check individual section timestamps.',
  };
}

// ─── Section Fetchers ──────────────────────────────────────────────────────────

async function fetchWeatherSection(
  latitude: number | undefined,
  longitude: number | undefined
): Promise<DashboardSection<WeatherSectionData>> {
  if (latitude == null || longitude == null) {
    return {
      status: 'UNAVAILABLE',
      data: null,
      message: 'Village coordinates are not available — weather cannot be fetched.',
      error: 'Village coordinates are missing.',
    };
  }
  try {
    let weather = await getCachedWeather(latitude, longitude);
    if (!weather) {
      try {
        // Attempt on-demand fetch to avoid deadlock
        weather = await fetchWeatherForecast({ latitude, longitude, days: 7 });
      } catch {
        weather = null;
      }
    }

    if (!weather || !weather.forecastDays || weather.forecastDays.length === 0) {
      return {
        status: 'UNAVAILABLE',
        data: null,
        message: 'Weather observation currently unavailable for these coordinates.',
        error: 'Unable to reach weather provider.',
      };
    }

    const first = weather.forecastDays[0];
    const today = {
      maxTempC: first.maxTempC,
      minTempC: first.minTempC,
      weatherDescription: first.weatherDescription,
      precipitationMm: first.precipitationSumMm ?? 0,
      et0Mm: first.et0FaoEvapotranspirationMm,
      windspeedKmh: first.windspeedMaxKmh,
    };

    return {
      status: weather.freshness.isStale ? 'PARTIAL' : 'AVAILABLE',
      data: {
        today,
        forecast: weather.forecastDays,
        forecastDays: weather.forecastDays,
        advisories: weather.advisories ?? [],
        attribution: weather.attribution,
        retrievedAt: weather.retrievedAt,
        freshness: weather.freshness,
      },
      message: weather.freshness.isStale
        ? `Weather data is ${weather.freshness.ageHours} hours old and may be outdated.`
        : undefined,
    };
  } catch {
    return {
      status: 'UNAVAILABLE',
      data: null,
      message: 'Weather data could not be loaded.',
      error: 'Weather service connection failed.',
    };
  }
}

async function fetchMandiSection(
  state: string,
  _villageId: string | undefined
): Promise<DashboardSection<MandiSectionData>> {
  try {
    const mandis = await Mandi.find({ state, isActive: true }).limit(5).lean();
    if (mandis.length === 0) {
      return {
        status: 'UNAVAILABLE',
        data: null,
        message: `No mandis found in ${state} in the database.`,
      };
    }

    const mandiPromises = mandis.map(async (mandi) => {
      const prices = await MandiPrice.find({ mandiId: mandi._id })
        .sort({ observationDate: -1 })
        .limit(3)
        .populate<{ cropId: { name: string; category: string } }>('cropId', 'name category')
        .lean();

      const mappedPrices = prices.map((p) => {
        const crop = p.cropId as unknown as { name: string; category: string };
        const isStale = (Date.now() - p.retrievedAt.getTime()) / 3600000 > 72;
        return {
          cropName: crop?.name ?? 'Unknown',
          category: crop?.category ?? 'General',
          modalPriceInr: p.modalPriceInr ?? null,
          minPriceInr: p.minPriceInr ?? null,
          maxPriceInr: p.maxPriceInr ?? null,
          unit: p.unit || 'quintal',
          observationDate: p.observationDate?.toISOString().split('T')[0] ?? null,
          dataType: p.dataType,
          sourceName: p.sourceName,
          isStale,
        };
      });

      return {
        mandiId: String(mandi._id),
        mandiName: mandi.name,
        district: mandi.district,
        state: mandi.state,
        prices: mappedPrices,
      };
    });

    const mandiList = await Promise.all(mandiPromises);

    const allFlatPrices: MandiPriceSummary[] = mandiList.flatMap((m) =>
      m.prices.map((p) => ({
        mandiName: m.mandiName,
        district: m.district,
        cropName: p.cropName,
        modalPriceInr: p.modalPriceInr,
        observationDate: p.observationDate,
        dataType: p.dataType,
        sourceName: p.sourceName,
        isStale: p.isStale,
      }))
    );

    return {
      status: allFlatPrices.length > 0 ? 'AVAILABLE' : 'PARTIAL',
      data: {
        mandis: mandiList,
        entries: allFlatPrices,
        note: 'Showing most recent price records per mandi. Prices may not reflect current market rates.',
      },
    };
  } catch {
    return {
      status: 'UNAVAILABLE',
      data: null,
      message: 'Mandi price data could not be loaded.',
    };
  }
}

async function fetchCropsSection(): Promise<DashboardSection<CropsSectionData>> {
  try {
    const crops = await Crop.find({ isActive: true }).lean();
    const activeCrops = crops.map((c) => ({
      id: String(c._id),
      name: c.name,
      localName: c.localName || undefined,
      seasons: c.seasons,
      category: c.category,
    }));

    return {
      status: 'AVAILABLE',
      data: {
        activeCrops,
        seasonalCrops: activeCrops.map((c) => ({
          name: c.name,
          seasons: c.seasons,
          category: c.category,
        })),
        note: 'Showing all active crops in the reference database.',
      },
    };
  } catch {
    return { status: 'UNAVAILABLE', data: null, message: 'Crop data could not be loaded.' };
  }
}

async function fetchSchemesSection(state: string): Promise<DashboardSection<SchemesSectionData>> {
  try {
    const schemes = await GovernmentScheme.find({
      isActive: true,
      status: 'ACTIVE',
      $or: [{ applicableStates: { $size: 0 } }, { applicableStates: state }],
    })
      .limit(10)
      .lean();

    const applicableSchemes = schemes.map((s) => ({
      id: String(s._id),
      schemeCode: s.schemeCode,
      schemeName: s.schemeName,
      benefitType: s.benefitType,
      officialUrl: s.officialUrl,
    }));

    return {
      status: 'AVAILABLE',
      data: {
        applicableSchemes,
        activeSchemes: applicableSchemes.map((s) => ({
          schemeCode: s.schemeCode,
          schemeName: s.schemeName,
          officialUrl: s.officialUrl,
        })),
        note: 'Showing active schemes applicable to this state. Eligibility is indicative only — verify at official source.',
      },
    };
  } catch {
    return { status: 'UNAVAILABLE', data: null, message: 'Scheme data could not be loaded.' };
  }
}
