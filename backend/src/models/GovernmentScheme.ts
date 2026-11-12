import { Schema, model, Document } from 'mongoose';

// ─── GovernmentScheme Model ────────────────────────────────────────────────────
// Manually curated from official government sources.
// No eligibility is determined by the system — only information is surfaced.

export type SchemeStatus = 'ACTIVE' | 'INACTIVE' | 'REQUIRES_VERIFICATION';

export interface IGovernmentScheme extends Document {
  schemeCode: string;          // e.g. "PM-KISAN", "PMFBY"
  schemeName: string;
  ministry: string;
  department?: string;
  benefitType: string;         // e.g. "Direct Income Support"
  benefitDescription: string;
  applicableStates: string[];  // Empty array = all states
  eligibilitySummary: string;  // Plain-language summary — NOT a legal determination
  eligibilityDetails: string[]; // Bullet-point conditions from official source
  exclusions: string[];        // From official exclusion criteria
  documentsRequired?: string[];
  applicationInstructions?: string;
  officialUrl: string;         // Official government portal URL
  applicationUrl?: string;     // Direct application link if available
  status: SchemeStatus;
  sourceVerifiedAt?: Date;     // Date this record was last verified against official source
  sourceVerifiedBy?: string;   // "Manually by team" or admin name
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const governmentSchemeSchema = new Schema<IGovernmentScheme>(
  {
    schemeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    schemeName: { type: String, required: true, trim: true },
    ministry: { type: String, required: true, trim: true },
    department: String,
    benefitType: { type: String, required: true },
    benefitDescription: { type: String, required: true },
    applicableStates: [String],
    eligibilitySummary: { type: String, required: true },
    eligibilityDetails: [String],
    exclusions: [String],
    documentsRequired: [String],
    applicationInstructions: String,
    officialUrl: { type: String, required: true },
    applicationUrl: String,
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'REQUIRES_VERIFICATION'],
      default: 'REQUIRES_VERIFICATION',
    },
    sourceVerifiedAt: Date,
    sourceVerifiedBy: String,
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

governmentSchemeSchema.index({ status: 1, isActive: 1 });
governmentSchemeSchema.index({ applicableStates: 1 });

export const GovernmentScheme = model<IGovernmentScheme>('GovernmentScheme', governmentSchemeSchema);
