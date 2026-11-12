/**
 * Government Support Engine — Service
 *
 * Provides organized, source-backed information about agricultural schemes.
 * All data is manually curated from official government sources.
 *
 * CONSTRAINTS:
 *  - No automated eligibility determination — only information is displayed.
 *  - Every record must carry a source URL and verification date.
 *  - The system always directs users to the official portal for applications.
 *  - Eligibility matching is INDICATIVE ONLY — not a legal determination.
 */

import mongoose from 'mongoose';
import { GovernmentScheme, IGovernmentScheme } from '../../models/GovernmentScheme';
import { NotFoundError } from '../../shared/errors';

export interface SchemeSearchParams {
  state?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'REQUIRES_VERIFICATION';
  search?: string;     // Full-text search in schemeName / eligibilitySummary
  page?: number;
  limit?: number;
}

export interface SchemeListItem {
  id: string;
  schemeCode: string;
  schemeName: string;
  ministry: string;
  benefitType: string;
  benefitDescription: string;
  status: string;
  applicableStates: string[];
  officialUrl: string;
  sourceVerifiedAt: string | null;
  eligibilitySummary: string;
}

export interface SchemeDetail extends SchemeListItem {
  department?: string;
  eligibilityDetails: string[];
  exclusions: string[];
  documentsRequired: string[];
  applicationInstructions?: string;
  applicationUrl?: string;
  notes?: string;
  disclaimer: string;
}

const ELIGIBILITY_DISCLAIMER =
  'This information is sourced from official government portals and is provided for informational purposes only. ' +
  'Krishi Setu does not determine official eligibility or guarantee scheme benefits. ' +
  'Eligibility conditions may change. Always verify with the official source before applying.';

// ─── List Schemes ──────────────────────────────────────────────────────────────

export async function listSchemes(params: SchemeSearchParams) {
  const filter: Record<string, unknown> = { isActive: true };

  if (params.status) filter.status = params.status;
  else filter.status = 'ACTIVE';   // Default to active only

  if (params.state) {
    filter.$or = [
      { applicableStates: { $size: 0 } },   // All-India schemes
      { applicableStates: params.state },
    ];
  }

  if (params.search) {
    filter.$text = { $search: params.search };
  }

  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);
  const skip = (page - 1) * limit;

  const [schemes, total] = await Promise.all([
    GovernmentScheme.find(filter).skip(skip).limit(limit).lean(),
    GovernmentScheme.countDocuments(filter),
  ]);

  return {
    schemes: schemes.map(toListItem),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Get Scheme Detail ─────────────────────────────────────────────────────────

export async function getSchemeById(id: string): Promise<SchemeDetail> {
  let scheme = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    scheme = await GovernmentScheme.findById(id).lean();
  }
  if (!scheme) {
    scheme = await GovernmentScheme.findOne({
      schemeCode: id.toUpperCase(),
    }).lean();
  }
  if (!scheme) throw new NotFoundError('Government scheme');
  return toDetailItem(scheme);
}

export async function getSchemeByCode(code: string): Promise<SchemeDetail> {
  const scheme = await GovernmentScheme.findOne({
    schemeCode: code.toUpperCase(),
  }).lean();
  if (!scheme) throw new NotFoundError(`Scheme with code ${code}`);
  return toDetailItem(scheme);
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function toListItem(s: IGovernmentScheme): SchemeListItem {
  return {
    id: String(s._id),
    schemeCode: s.schemeCode,
    schemeName: s.schemeName,
    ministry: s.ministry,
    benefitType: s.benefitType,
    benefitDescription: s.benefitDescription,
    status: s.status,
    applicableStates: s.applicableStates,
    officialUrl: s.officialUrl,
    sourceVerifiedAt: s.sourceVerifiedAt?.toISOString() ?? null,
    eligibilitySummary: s.eligibilitySummary,
  };
}

function toDetailItem(s: IGovernmentScheme): SchemeDetail {
  return {
    ...toListItem(s),
    department: s.department,
    eligibilityDetails: s.eligibilityDetails,
    exclusions: s.exclusions,
    documentsRequired: s.documentsRequired ?? [],
    applicationInstructions: s.applicationInstructions,
    applicationUrl: s.applicationUrl,
    notes: s.notes,
    disclaimer: ELIGIBILITY_DISCLAIMER,
  };
}
