import { Schema, model, Document, Types } from 'mongoose';
import { DataType } from '../shared/provenance';

// ─── MandiPrice Model ──────────────────────────────────────────────────────────
// One record = one daily price entry for one crop at one mandi.
// Source provenance is mandatory so synthetic data is never confused with live data.

export interface IMandiPrice extends Document {
  mandiId: Types.ObjectId;
  cropId: Types.ObjectId;
  // OGD / Agmarknet fields
  variety?: string;           // e.g. "FAQ", "Desi"
  grade?: string;
  observationDate: Date;      // Arrival/price date from the source
  minPriceInr?: number;       // ₹/quintal
  maxPriceInr?: number;       // ₹/quintal
  modalPriceInr?: number;     // ₹/quintal — primary figure used for calculations
  unit: string;               // Must be 'quintal' for this project's calculations
  // Provenance
  dataType: DataType;
  sourceName: string;
  sourceUrl?: string;
  sourceRecordId?: string;
  retrievedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mandiPriceSchema = new Schema<IMandiPrice>(
  {
    mandiId: { type: Schema.Types.ObjectId, ref: 'Mandi', required: true, index: true },
    cropId: { type: Schema.Types.ObjectId, ref: 'Crop', required: true, index: true },
    variety: String,
    grade: String,
    observationDate: { type: Date, required: true },
    minPriceInr: { type: Number, min: 0 },
    maxPriceInr: { type: Number, min: 0 },
    modalPriceInr: { type: Number, min: 0 },
    unit: { type: String, required: true, default: 'quintal' },
    dataType: {
      type: String,
      required: true,
      enum: ['VERIFIED_LIVE', 'VERIFIED_HISTORICAL', 'SYNTHETIC_DEMO', 'MANUALLY_ENTERED', 'REQUIRES_VERIFICATION'],
    },
    sourceName: { type: String, required: true },
    sourceUrl: String,
    sourceRecordId: String,
    retrievedAt: { type: Date, required: true, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

// Compound index: mandi + crop + date (allowing multiple varieties per day)
mandiPriceSchema.index({ mandiId: 1, cropId: 1, observationDate: -1 });
mandiPriceSchema.index({ observationDate: -1 });
mandiPriceSchema.index({ dataType: 1 });

export const MandiPrice = model<IMandiPrice>('MandiPrice', mandiPriceSchema);
