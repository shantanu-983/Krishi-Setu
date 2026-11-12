import { Schema, model, Document, Types } from 'mongoose';

// ─── Crop Model ────────────────────────────────────────────────────────────────
// Stores reference information about crops. Parameters (pH, temperature, etc.)
// are populated from curated, attributed sources only — not invented.

export interface ICrop extends Document {
  name: string;                   // e.g. "Wheat"
  localName?: string;             // e.g. "Gehun"
  category: 'CEREAL' | 'PULSE' | 'OILSEED' | 'VEGETABLE' | 'FRUIT' | 'SPICE' | 'CASH_CROP' | 'OTHER';
  seasons: Array<'KHARIF' | 'RABI' | 'ZAID'>;
  // Growing conditions — from verified sources only (see sourceReference)
  conditions: {
    minTempC?: number;
    maxTempC?: number;
    minRainfallMm?: number;
    maxRainfallMm?: number;
    soilTypes?: string[];         // e.g. ["Black Cotton", "Alluvial"]
    phMin?: number;
    phMax?: number;
    waterRequirement?: 'LOW' | 'MEDIUM' | 'HIGH';
    notes?: string;               // Free-text for caveats
  };
  sourceReference?: string;       // e.g. "ICAR Crop Guide 2023, Table 4"
  sourceUrl?: string;
  conditionsVerified: boolean;    // false until an expert has reviewed
  ogdCommodityNames?: string[];   // Name variants used in OGD/Agmarknet data
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cropSchema = new Schema<ICrop>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    localName: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['CEREAL', 'PULSE', 'OILSEED', 'VEGETABLE', 'FRUIT', 'SPICE', 'CASH_CROP', 'OTHER'],
    },
    seasons: [{ type: String, enum: ['KHARIF', 'RABI', 'ZAID'] }],
    conditions: {
      minTempC: Number,
      maxTempC: Number,
      minRainfallMm: Number,
      maxRainfallMm: Number,
      soilTypes: [String],
      phMin: Number,
      phMax: Number,
      waterRequirement: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
      notes: String,
    },
    sourceReference: String,
    sourceUrl: String,
    conditionsVerified: { type: Boolean, default: false },
    ogdCommodityNames: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cropSchema.index({ seasons: 1 });
cropSchema.index({ category: 1 });

export const Crop = model<ICrop>('Crop', cropSchema);
