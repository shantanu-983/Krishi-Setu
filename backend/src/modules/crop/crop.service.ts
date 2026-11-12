/**
 * Crop Opportunity Engine — Service
 *
 * Assesses potential crop opportunities based on user-entered farm conditions
 * compared against documented crop requirements.
 *
 * IMPORTANT CONSTRAINTS:
 *  - Does NOT invent soil properties, yield, or profitability data.
 *  - Does NOT implement a weighted COS formula (pending guide approval).
 *  - Returns INSUFFICIENT_DATA when required parameters are missing.
 *  - Only uses conditions marked conditionsVerified: true.
 *  - All factor matching is transparent — reasons are always shown.
 */

import { Crop, ICrop } from '../../models/Crop';
import { ValidationError } from '../../shared/errors';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SoilType =
  | 'Black Cotton'
  | 'Alluvial'
  | 'Red Laterite'
  | 'Sandy'
  | 'Sandy Loam'
  | 'Clay'
  | 'Loamy'
  | 'Other';

export type Season = 'KHARIF' | 'RABI' | 'ZAID';
export type WaterAvailability = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CropAssessmentInput {
  season: Season;
  soilType?: SoilType;
  soilPh?: number;
  annualRainfallMm?: number;
  waterAvailability?: WaterAvailability;
  state?: string;
}

export type MatchLevel = 'MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'UNKNOWN';

export interface FactorResult {
  factor: string;
  inputValue: string | null;
  requiredRange?: string;
  matchLevel: MatchLevel;
  note: string;
}

export interface CropOpportunityResult {
  cropId: string;
  cropName: string;
  localName?: string;
  seasons: string[];
  factorResults: FactorResult[];
  overallAssessment: 'POTENTIALLY_SUITABLE' | 'INSUFFICIENT_DATA' | 'CONDITION_MISMATCH';
  assessmentNote: string;
  dataLimitations: string[];
  conditionsVerified: boolean;
  sourceReference?: string;
}

export interface CropAssessmentResponse {
  input: CropAssessmentInput;
  disclaimer: string;
  results: CropOpportunityResult[];
  generatedAt: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export async function assessCropOpportunities(
  input: CropAssessmentInput
): Promise<CropAssessmentResponse> {
  if (input.soilPh !== undefined && (input.soilPh < 0 || input.soilPh > 14)) {
    throw new ValidationError('Soil pH must be between 0 and 14');
  }
  if (input.annualRainfallMm !== undefined && input.annualRainfallMm < 0) {
    throw new ValidationError('Annual rainfall cannot be negative');
  }

  // Only load crops that match the season and are active
  const crops = await Crop.find({
    seasons: input.season,
    isActive: true,
  }).lean();

  const results: CropOpportunityResult[] = crops.map((crop) =>
    assessSingleCrop(crop, input)
  );

  return {
    input,
    disclaimer:
      'These assessments are based on general documented crop requirements and your entered farm conditions. ' +
      'They are NOT a guarantee of suitability or profitability. ' +
      'Consult an agricultural extension officer or KVK before making planting decisions. ' +
      'Crop conditions marked as unverified should be treated as indicative only.',
    results,
    generatedAt: new Date().toISOString(),
  };
}

function assessSingleCrop(
  crop: ICrop,
  input: CropAssessmentInput
): CropOpportunityResult {
  const factors: FactorResult[] = [];
  const limitations: string[] = [];

  if (!crop.conditionsVerified) {
    limitations.push(
      'Crop growing conditions have not been verified against an authoritative source. Results are indicative only.'
    );
  }

  // ── Factor: Season ──────────────────────────────────────────────────────────
  // Season is already filtered — this factor always matches
  factors.push({
    factor: 'Season',
    inputValue: input.season,
    matchLevel: 'MATCH',
    note: `${crop.name} is documented as a ${input.season} crop.`,
  });

  // ── Factor: Soil Type ───────────────────────────────────────────────────────
  if (input.soilType) {
    if (
      crop.conditions.soilTypes &&
      crop.conditions.soilTypes.length > 0
    ) {
      const matches = crop.conditions.soilTypes.some(
        (s) => s.toLowerCase() === input.soilType!.toLowerCase()
      );
      factors.push({
        factor: 'Soil Type',
        inputValue: input.soilType,
        requiredRange: crop.conditions.soilTypes.join(', '),
        matchLevel: matches ? 'MATCH' : 'NO_MATCH',
        note: matches
          ? `${input.soilType} is listed as a suitable soil type for ${crop.name}.`
          : `${input.soilType} is not in the documented suitable soil types for ${crop.name}: ${crop.conditions.soilTypes.join(', ')}.`,
      });
    } else {
      factors.push({
        factor: 'Soil Type',
        inputValue: input.soilType,
        matchLevel: 'UNKNOWN',
        note: 'Soil type requirements for this crop are not documented.',
      });
      limitations.push('Soil type requirements not available.');
    }
  } else {
    limitations.push('Soil type was not provided — soil suitability not assessed.');
  }

  // ── Factor: Soil pH ─────────────────────────────────────────────────────────
  if (input.soilPh !== undefined) {
    const { phMin, phMax } = crop.conditions;
    if (phMin !== undefined && phMax !== undefined) {
      const inRange = input.soilPh >= phMin && input.soilPh <= phMax;
      const nearRange =
        input.soilPh >= phMin - 0.5 && input.soilPh <= phMax + 0.5;
      factors.push({
        factor: 'Soil pH',
        inputValue: String(input.soilPh),
        requiredRange: `${phMin}–${phMax}`,
        matchLevel: inRange ? 'MATCH' : nearRange ? 'PARTIAL_MATCH' : 'NO_MATCH',
        note: inRange
          ? `pH ${input.soilPh} is within the documented suitable range of ${phMin}–${phMax}.`
          : nearRange
          ? `pH ${input.soilPh} is slightly outside the documented range of ${phMin}–${phMax}.`
          : `pH ${input.soilPh} is outside the documented suitable range of ${phMin}–${phMax}.`,
      });
    } else {
      factors.push({
        factor: 'Soil pH',
        inputValue: String(input.soilPh),
        matchLevel: 'UNKNOWN',
        note: 'pH requirements for this crop are not documented.',
      });
    }
  }

  // ── Factor: Rainfall ────────────────────────────────────────────────────────
  if (input.annualRainfallMm !== undefined) {
    const { minRainfallMm, maxRainfallMm } = crop.conditions;
    if (minRainfallMm !== undefined && maxRainfallMm !== undefined) {
      const inRange =
        input.annualRainfallMm >= minRainfallMm &&
        input.annualRainfallMm <= maxRainfallMm;
      factors.push({
        factor: 'Annual Rainfall',
        inputValue: `${input.annualRainfallMm} mm`,
        requiredRange: `${minRainfallMm}–${maxRainfallMm} mm`,
        matchLevel: inRange ? 'MATCH' : 'NO_MATCH',
        note: inRange
          ? `${input.annualRainfallMm} mm is within the documented range for ${crop.name}.`
          : `${input.annualRainfallMm} mm is outside the documented range of ${minRainfallMm}–${maxRainfallMm} mm for ${crop.name}.`,
      });
    } else {
      factors.push({
        factor: 'Annual Rainfall',
        inputValue: `${input.annualRainfallMm} mm`,
        matchLevel: 'UNKNOWN',
        note: 'Rainfall requirements for this crop are not documented.',
      });
    }
  }

  // ── Factor: Water Availability ──────────────────────────────────────────────
  if (input.waterAvailability) {
    const req = crop.conditions.waterRequirement;
    if (req) {
      const waterRank: Record<WaterAvailability, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      const available = waterRank[input.waterAvailability];
      const required = waterRank[req];
      const matchLevel: MatchLevel =
        available >= required ? 'MATCH' : available === required - 1 ? 'PARTIAL_MATCH' : 'NO_MATCH';
      factors.push({
        factor: 'Water Availability',
        inputValue: input.waterAvailability,
        requiredRange: req,
        matchLevel,
        note:
          matchLevel === 'MATCH'
            ? `Available water (${input.waterAvailability}) meets the documented requirement (${req}).`
            : `Available water (${input.waterAvailability}) may be insufficient; documented requirement is ${req}.`,
      });
    } else {
      factors.push({
        factor: 'Water Availability',
        inputValue: input.waterAvailability,
        matchLevel: 'UNKNOWN',
        note: 'Water requirement for this crop is not documented.',
      });
    }
  }

  // ── Overall Assessment ──────────────────────────────────────────────────────
  const nonUnknownFactors = factors.filter((f) => f.matchLevel !== 'UNKNOWN');
  const hasNoMatch = nonUnknownFactors.some((f) => f.matchLevel === 'NO_MATCH');
  const hasEnoughData = nonUnknownFactors.length >= 2;

  let overallAssessment: CropOpportunityResult['overallAssessment'];
  let assessmentNote: string;

  if (!hasEnoughData) {
    overallAssessment = 'INSUFFICIENT_DATA';
    assessmentNote =
      'Not enough farm condition data was provided to assess suitability. Please enter more information.';
  } else if (hasNoMatch) {
    overallAssessment = 'CONDITION_MISMATCH';
    assessmentNote =
      'One or more entered farm conditions do not match the documented requirements for this crop.';
  } else {
    overallAssessment = 'POTENTIALLY_SUITABLE';
    assessmentNote =
      'Entered conditions are broadly consistent with documented requirements. This is an indicative match only — not a prediction of success or profitability.';
  }

  return {
    cropId: String(crop._id),
    cropName: crop.name,
    localName: crop.localName,
    seasons: crop.seasons,
    factorResults: factors,
    overallAssessment,
    assessmentNote,
    dataLimitations: limitations,
    conditionsVerified: crop.conditionsVerified,
    sourceReference: crop.sourceReference,
  };
}
