/**
 * Climate Risk Engine — Agronomic Weather Advisory Service
 *
 * Translates meteorological parameters (temperature, precipitation, ET₀, windspeed)
 * into deterministic, explainable agricultural advisories and precautions.
 *
 * Rules:
 *  - ADV-HEAT-01: High temperature / canopy heat stress
 *  - ADV-RAIN-01: Heavy rainfall / waterlogging alert
 *  - ADV-DRY-01:  Extended dry spell / soil moisture deficit
 *  - ADV-WIND-01: High windspeed / foliar spray drift prohibition
 *  - ADV-SPRAY-01: Favorable spray window
 *  - ADV-DISEASE-01: Fungal disease / prolonged leaf wetness
 */

export interface AgronomicAdvisory {
  id: string;
  category: 'HEAT' | 'RAINFALL' | 'DROUGHT' | 'WIND' | 'SPRAY_WINDOW' | 'DISEASE';
  severity: 'INFO' | 'WARNING' | 'ALERT';
  title: string;
  description: string;
  actionableAdvice: string;
  applicableDates: string[];
}

export interface DailyWeatherInput {
  date: string;
  maxTempC: number | null;
  minTempC: number | null;
  precipitationSumMm: number | null;
  et0FaoEvapotranspirationMm: number | null;
  weatherCode?: number | null;
  windspeedMaxKmh: number | null;
}

/**
 * Computes deterministic agronomic advisories based on a multi-day weather series.
 */
export function generateAgronomicAdvisories(
  days: DailyWeatherInput[]
): AgronomicAdvisory[] {
  if (!days || days.length === 0) return [];

  const advisories: AgronomicAdvisory[] = [];

  // 1. ADV-HEAT-01: Extreme heat / canopy stress (Max temp >= 35°C)
  const heatDays = days.filter((d) => d.maxTempC != null && d.maxTempC >= 35);
  if (heatDays.length > 0) {
    advisories.push({
      id: 'ADV-HEAT-01',
      category: 'HEAT',
      severity: 'WARNING',
      title: 'Elevated Temperature & Evaporative Stress Warning',
      description: `Maximum temperature exceeds 35°C on ${heatDays.length} day(s) (peak: ${Math.max(
        ...heatDays.map((d) => d.maxTempC!)
      )}°C).`,
      actionableAdvice:
        'Schedule light irrigation during evening or early morning hours to lower soil/canopy temperature and mitigate transpirational shock. Avoid pesticide application during midday heat.',
      applicableDates: heatDays.map((d) => d.date),
    });
  }

  // 2. ADV-RAIN-01: Heavy rainfall or 3-day deluge
  const heavyRainDays = days.filter(
    (d) => d.precipitationSumMm != null && d.precipitationSumMm >= 35
  );
  let threeDayDelugeDates: string[] = [];
  for (let i = 0; i <= days.length - 3; i++) {
    const sum3 =
      (days[i].precipitationSumMm ?? 0) +
      (days[i + 1].precipitationSumMm ?? 0) +
      (days[i + 2].precipitationSumMm ?? 0);
    if (sum3 >= 60) {
      threeDayDelugeDates.push(days[i].date, days[i + 1].date, days[i + 2].date);
    }
  }
  threeDayDelugeDates = Array.from(new Set(threeDayDelugeDates));

  const allRainAlertDates = Array.from(
    new Set([...heavyRainDays.map((d) => d.date), ...threeDayDelugeDates])
  );
  if (allRainAlertDates.length > 0) {
    advisories.push({
      id: 'ADV-RAIN-01',
      category: 'RAINFALL',
      severity: 'ALERT',
      title: 'Heavy Rainfall & Waterlogging Alert',
      description: 'Forecast indicates heavy precipitation or accumulated deluge above 60 mm.',
      actionableAdvice:
        'Clear field drainage channels immediately to prevent root waterlogging. Postpone urea top-dressing and chemical sprayings to avoid fertilizer leaching and agrochemical runoff.',
      applicableDates: allRainAlertDates,
    });
  }

  // 3. ADV-DRY-01: Extended dry spell (5+ consecutive days with rain < 1mm and ET0 >= 4.0)
  let dryRun: DailyWeatherInput[] = [];
  const drySpellDates: string[] = [];

  for (const d of days) {
    const isDry =
      (d.precipitationSumMm == null || d.precipitationSumMm < 1.0) &&
      (d.et0FaoEvapotranspirationMm != null && d.et0FaoEvapotranspirationMm >= 4.0);
    if (isDry) {
      dryRun.push(d);
    } else {
      if (dryRun.length >= 5) {
        drySpellDates.push(...dryRun.map((item) => item.date));
      }
      dryRun = [];
    }
  }
  if (dryRun.length >= 5) {
    drySpellDates.push(...dryRun.map((item) => item.date));
  }

  if (drySpellDates.length >= 5) {
    advisories.push({
      id: 'ADV-DRY-01',
      category: 'DROUGHT',
      severity: 'WARNING',
      title: 'Prolonged Dry Spell & Evapotranspiration Deficit',
      description: `Detected 5 or more consecutive days without rainfall accompanied by high evapotranspiration (ET₀ ≥ 4.0 mm/day).`,
      actionableAdvice:
        'Soil moisture depletion expected. Apply organic mulch or crop residue to conserve moisture; arrange supplemental furrow or drip irrigation for sensitive standing crops.',
      applicableDates: Array.from(new Set(drySpellDates)),
    });
  }

  // 4. ADV-WIND-01: High windspeed / Spray drift hazard (Windspeed >= 20 km/h)
  const windyDays = days.filter(
    (d) => d.windspeedMaxKmh != null && d.windspeedMaxKmh >= 20.0
  );
  if (windyDays.length > 0) {
    advisories.push({
      id: 'ADV-WIND-01',
      category: 'WIND',
      severity: 'WARNING',
      title: 'High Windspeed — Chemical Spray Drift Warning',
      description: `Wind gusts exceed 20 km/h on ${windyDays.length} day(s) (peak: ${Math.max(
        ...windyDays.map((d) => d.windspeedMaxKmh!)
      )} km/h).`,
      actionableAdvice:
        'Suspended foliar pesticide and insecticide spraying: wind speeds above 20 km/h cause severe drift, wastage, and environmental contamination. Check tall standing crops (sugarcane, maize, mustard) for lodging risk.',
      applicableDates: windyDays.map((d) => d.date),
    });
  }

  // 5. ADV-SPRAY-01: Favorable Spray Window (Rain = 0, Wind 5–15 km/h, Temp <= 32°C)
  const idealSprayDays = days.filter(
    (d) =>
      (d.precipitationSumMm == null || d.precipitationSumMm === 0) &&
      d.windspeedMaxKmh != null &&
      d.windspeedMaxKmh >= 5 &&
      d.windspeedMaxKmh <= 15 &&
      d.maxTempC != null &&
      d.maxTempC <= 32
  );
  if (idealSprayDays.length > 0) {
    advisories.push({
      id: 'ADV-SPRAY-01',
      category: 'SPRAY_WINDOW',
      severity: 'INFO',
      title: 'Optimal Weather Window for Foliar Applications',
      description: `Calm, dry conditions with mild winds (5–15 km/h) and moderate temperature (≤ 32°C) on ${idealSprayDays.length} day(s).`,
      actionableAdvice:
        'Ideal time for scheduled foliar nutrient sprays, micronutrient supplementation, and registered bio-fungicides for maximum foliar absorption and minimal drift.',
      applicableDates: idealSprayDays.map((d) => d.date),
    });
  }

  // 6. ADV-DISEASE-01: Fungal Disease / prolonged moisture (2+ consecutive days rain >= 10mm & temp 22-30C)
  const fungalDates: string[] = [];
  for (let i = 0; i <= days.length - 2; i++) {
    const d1 = days[i];
    const d2 = days[i + 1];
    const wet1 = (d1.precipitationSumMm ?? 0) >= 10 && (d1.maxTempC ?? 0) >= 22 && (d1.maxTempC ?? 0) <= 30;
    const wet2 = (d2.precipitationSumMm ?? 0) >= 10 && (d2.maxTempC ?? 0) >= 22 && (d2.maxTempC ?? 0) <= 30;
    if (wet1 && wet2) {
      fungalDates.push(d1.date, d2.date);
    }
  }
  if (fungalDates.length > 0) {
    advisories.push({
      id: 'ADV-DISEASE-01',
      category: 'DISEASE',
      severity: 'WARNING',
      title: 'Foliar Fungal Infection Risk Precaution',
      description: 'Persistent leaf wetness combined with moderate temperatures (22–30°C) creates favorable conditions for fungal spore germination.',
      actionableAdvice:
        'Scout crops regularly for rust, leaf spot, or blight symptoms on lower leaves. Ensure good plant canopy aeration and avoid flood irrigation during this window.',
      applicableDates: Array.from(new Set(fungalDates)),
    });
  }

  return advisories;
}
