/**
 * Data provenance types.
 * Every record sourced from an external provider or manually entered
 * must carry a DataProvenance object so users and the system can
 * distinguish verified live data from synthetic or manually entered data.
 */

export type DataType =
  | 'VERIFIED_LIVE'        // Fetched from an official source and validated
  | 'VERIFIED_HISTORICAL'  // Official historical data, validated
  | 'SYNTHETIC_DEMO'       // Clearly labelled development fixture — NOT official
  | 'MANUALLY_ENTERED'     // Entered by an admin or user
  | 'REQUIRES_VERIFICATION'; // Exists in the system but not yet verified

export interface DataProvenance {
  sourceName: string;          // e.g. "OGD Mandi Dataset (data.gov.in)"
  sourceId?: string;           // DS-01, DS-03, etc. from the data register
  sourceRecordId?: string;     // Row/record ID from the provider, if available
  sourceUrl?: string;          // Official source URL
  observationDate?: Date;      // Date the observation was made at the source
  retrievedAt: Date;           // When our system fetched/stored this record
  unit?: string;               // e.g. "INR/quintal"
  dataType: DataType;
  notes?: string;
}

export interface FreshnessResult {
  isStale: boolean;
  ageHours: number;
  lastUpdated: Date;
}

export function checkFreshness(
  retrievedAt: Date,
  staleAfterHours: number
): FreshnessResult {
  const now = new Date();
  const ageMs = now.getTime() - retrievedAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return {
    isStale: ageHours > staleAfterHours,
    ageHours: Math.round(ageHours * 10) / 10,
    lastUpdated: retrievedAt,
  };
}

export const SYNTHETIC_PROVENANCE: DataProvenance = {
  sourceName: 'Krishi Setu Development Fixtures',
  sourceId: undefined,
  sourceUrl: undefined,
  observationDate: undefined,
  retrievedAt: new Date('2026-10-31'),
  unit: undefined,
  dataType: 'SYNTHETIC_DEMO',
  notes:
    'SAMPLE DATA FOR DEMONSTRATION ONLY. Not official government data. Do not use for actual selling decisions.',
};
