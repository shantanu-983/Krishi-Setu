/**
 * Smart Mandi Decision Engine — Service
 *
 * Calculates transparent estimated net realization for selling a crop at a mandi.
 *
 * Formula (confirmed, not MOS):
 *   Gross Sale Value = Modal Price (₹/quintal) × Quantity (quintals)
 *   Net Realization  = Gross Sale Value − Transport Cost − Other Selling Costs
 *
 * Rules enforced here:
 *  - Modal price only; never silently substitute min/max if modal is missing.
 *  - Quantity must be > 0.
 *  - Costs must be ≥ 0.
 *  - Blank cost = unknown (not zero) → result is labelled INCOMPLETE.
 *  - Explicitly entered 0 is valid.
 *  - Result is always labelled ESTIMATE.
 *  - No MOS formula is computed (pending guide approval).
 */

import { Types } from 'mongoose';
import { MandiPrice, IMandiPrice } from '../../models/MandiPrice';
import { Mandi, IMandi } from '../../models/Mandi';
import { Crop, ICrop } from '../../models/Crop';
import { config } from '../../config/env';
import { checkFreshness } from '../../shared/provenance';
import { NotFoundError, ValidationError } from '../../shared/errors';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MandiComparisonInput {
  cropId: string;
  quantityQuintals: number;
  mandiEntries: Array<{
    mandiId: string;
    transportCostInr: number | null;   // null = unknown/not entered
    otherCostsInr: number | null;
  }>;
}

export interface SingleMandiResult {
  mandiId: string;
  mandiName: string;
  district: string;
  state: string;
  price: {
    modalPriceInr: number | null;
    minPriceInr: number | null;
    maxPriceInr: number | null;
    observationDate: string | null;
    isStale: boolean;
    ageHours: number | null;
    dataType: string;
    sourceName: string;
    note: string | null;
  };
  costs: {
    transportCostInr: number | null;
    otherCostsInr: number | null;
    transportCostType: 'USER_ENTERED' | 'UNKNOWN';
  };
  calculation: {
    status: 'COMPLETE' | 'INCOMPLETE' | 'NO_PRICE_DATA';
    grossSaleValueInr: number | null;
    totalCostsInr: number | null;
    estimatedNetRealizationInr: number | null;
    disclaimer: string;
    missingFields: string[];
  };
}

export interface MandiComparisonResult {
  cropName: string;
  quantityQuintals: number;
  unit: 'quintal';
  resultsDisclaimer: string;
  mandis: SingleMandiResult[];
  generatedAt: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

export async function compareMandis(
  input: MandiComparisonInput
): Promise<MandiComparisonResult> {
  // 1. Validate quantity
  if (input.quantityQuintals <= 0) {
    throw new ValidationError('Quantity must be greater than 0 quintals');
  }
  if (input.mandiEntries.length === 0) {
    throw new ValidationError('At least one mandi must be provided for comparison');
  }
  if (input.mandiEntries.length > 10) {
    throw new ValidationError('At most 10 mandis can be compared at once');
  }

  // 2. Load crop
  const crop = await Crop.findById(input.cropId);
  if (!crop) throw new NotFoundError('Crop');

  // 3. Process each mandi
  const results: SingleMandiResult[] = await Promise.all(
    input.mandiEntries.map((entry) =>
      processMandiEntry(entry, crop, input.quantityQuintals)
    )
  );

  return {
    cropName: crop.name,
    quantityQuintals: input.quantityQuintals,
    unit: 'quintal',
    resultsDisclaimer:
      'These figures are estimates based on available reference prices and user-entered costs. ' +
      'Actual prices at the mandi on the day of sale may differ. ' +
      'Verify current prices before making any selling decision.',
    mandis: results,
    generatedAt: new Date().toISOString(),
  };
}

async function processMandiEntry(
  entry: MandiComparisonInput['mandiEntries'][number],
  crop: ICrop,
  quantityQuintals: number
): Promise<SingleMandiResult> {
  // Validate costs
  if (entry.transportCostInr !== null && entry.transportCostInr < 0) {
    throw new ValidationError(
      `Transport cost cannot be negative for mandi ${entry.mandiId}`
    );
  }
  if (entry.otherCostsInr !== null && entry.otherCostsInr < 0) {
    throw new ValidationError(
      `Other costs cannot be negative for mandi ${entry.mandiId}`
    );
  }

  // Load mandi
  const mandi = await Mandi.findById(entry.mandiId);
  if (!mandi) throw new NotFoundError(`Mandi (id: ${entry.mandiId})`);

  // Find most recent price record for this mandi + crop
  const priceRecord = await MandiPrice.findOne({
    mandiId: mandi._id,
    cropId: crop._id,
  })
    .sort({ observationDate: -1 })
    .lean();

  return buildResult(mandi, crop, priceRecord, entry, quantityQuintals);
}

function buildResult(
  mandi: IMandi,
  crop: ICrop,
  priceRecord: IMandiPrice | null,
  entry: MandiComparisonInput['mandiEntries'][number],
  quantityQuintals: number
): SingleMandiResult {
  const missingFields: string[] = [];

  // ── Price info ──────────────────────────────────────────────────────────────
  let modalPrice: number | null = null;
  let priceIsStale = false;
  let priceAgeHours: number | null = null;
  let priceNote: string | null = null;

  if (!priceRecord) {
    missingFields.push('modal_price');
    priceNote = 'No price data available for this crop at this mandi.';
  } else {
    if (priceRecord.modalPriceInr == null) {
      missingFields.push('modal_price');
      priceNote =
        'Modal price is missing from source data. Min/max prices are not substituted.';
    } else {
      modalPrice = priceRecord.modalPriceInr;
    }
    if (priceRecord.unit !== 'quintal') {
      missingFields.push('price_unit_mismatch');
      priceNote = `Source unit is "${priceRecord.unit}", not "quintal". Calculation blocked.`;
      modalPrice = null;
    }
    const freshness = checkFreshness(
      priceRecord.retrievedAt,
      config.PRICE_STALE_AFTER_HOURS
    );
    priceIsStale = freshness.isStale;
    priceAgeHours = freshness.ageHours;
    if (priceIsStale) {
      if (!priceNote) priceNote = `Price data is ${freshness.ageHours} hours old and may not reflect current market rates.`;
    }
  }

  // ── Costs ───────────────────────────────────────────────────────────────────
  if (entry.transportCostInr === null) missingFields.push('transport_cost');
  if (entry.otherCostsInr === null) missingFields.push('other_costs');

  // ── Calculation ─────────────────────────────────────────────────────────────
  let grossSaleValue: number | null = null;
  let totalCosts: number | null = null;
  let netRealization: number | null = null;
  let calcStatus: 'COMPLETE' | 'INCOMPLETE' | 'NO_PRICE_DATA';

  if (!priceRecord || modalPrice === null) {
    calcStatus = 'NO_PRICE_DATA';
  } else if (entry.transportCostInr === null || entry.otherCostsInr === null) {
    calcStatus = 'INCOMPLETE';
    grossSaleValue = round2(modalPrice * quantityQuintals);
  } else {
    calcStatus = 'COMPLETE';
    grossSaleValue = round2(modalPrice * quantityQuintals);
    totalCosts = round2(entry.transportCostInr + entry.otherCostsInr);
    netRealization = round2(grossSaleValue - totalCosts);
  }

  const disclaimer =
    calcStatus === 'COMPLETE'
      ? 'Estimated Net Realization is based on the modal price shown and user-entered costs. This is an estimate, not a guaranteed payment.'
      : calcStatus === 'INCOMPLETE'
      ? 'Gross value calculated but net realization cannot be computed because one or more selling costs (transport or other costs) were not entered.'
      : 'Calculation not possible — no price data available for this mandi and crop.';

  return {
    mandiId: String(mandi._id),
    mandiName: mandi.name,
    district: mandi.district,
    state: mandi.state,
    price: {
      modalPriceInr: modalPrice,
      minPriceInr: priceRecord?.minPriceInr ?? null,
      maxPriceInr: priceRecord?.maxPriceInr ?? null,
      observationDate: priceRecord?.observationDate?.toISOString().split('T')[0] ?? null,
      isStale: priceIsStale,
      ageHours: priceAgeHours,
      dataType: priceRecord?.dataType ?? 'NO_DATA',
      sourceName: priceRecord?.sourceName ?? 'No data',
      note: priceNote,
    },
    costs: {
      transportCostInr: entry.transportCostInr,
      otherCostsInr: entry.otherCostsInr,
      transportCostType: entry.transportCostInr !== null ? 'USER_ENTERED' : 'UNKNOWN',
    },
    calculation: {
      status: calcStatus,
      grossSaleValueInr: grossSaleValue,
      totalCostsInr: totalCosts,
      estimatedNetRealizationInr: netRealization,
      disclaimer,
      missingFields,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
