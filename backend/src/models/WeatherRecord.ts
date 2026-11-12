import { Schema, model, Document } from 'mongoose';

// ─── WeatherRecord Model ───────────────────────────────────────────────────────
// Stores weather data fetched from Open-Meteo.
// FORECAST and HISTORICAL records are stored separately and clearly labelled.

export type WeatherRecordType = 'FORECAST' | 'HISTORICAL';

export interface IWeatherRecord extends Document {
  latitude: number;
  longitude: number;
  locationLabel?: string;    // Human-readable label, e.g. "Bhopal, MP"
  recordType: WeatherRecordType;
  date: Date;                // The date this observation/forecast is FOR
  // Daily variables (from Open-Meteo daily API)
  maxTempC?: number;
  minTempC?: number;
  precipitationSumMm?: number;
  et0FaoEvapotranspirationMm?: number;
  weatherCode?: number;      // WMO weather code
  windspeedMaxKmh?: number;
  // Source provenance
  sourceName: string;        // "Open-Meteo Forecast API" or "Open-Meteo Historical API"
  sourceUrl: string;
  retrievedAt: Date;
  modelUsed?: string;        // e.g. "best_match", "era5"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const weatherRecordSchema = new Schema<IWeatherRecord>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    locationLabel: String,
    recordType: { type: String, required: true, enum: ['FORECAST', 'HISTORICAL'] },
    date: { type: Date, required: true },
    maxTempC: Number,
    minTempC: Number,
    precipitationSumMm: { type: Number, min: 0 },
    et0FaoEvapotranspirationMm: Number,
    weatherCode: Number,
    windspeedMaxKmh: { type: Number, min: 0 },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    retrievedAt: { type: Date, required: true, default: Date.now },
    modelUsed: String,
    notes: String,
  },
  { timestamps: true }
);

// Unique: (lat, lon, date, recordType) — no duplicate entries
weatherRecordSchema.index(
  { latitude: 1, longitude: 1, date: 1, recordType: 1 },
  { unique: true }
);
weatherRecordSchema.index({ date: -1 });
weatherRecordSchema.index({ retrievedAt: -1 });

export const WeatherRecord = model<IWeatherRecord>('WeatherRecord', weatherRecordSchema);
