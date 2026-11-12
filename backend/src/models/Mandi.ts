import { Schema, model, Document } from 'mongoose';

// ─── Mandi Model ───────────────────────────────────────────────────────────────
// Agricultural market yards. Location data stored for map display.
// Coordinates must be verified before use — not fabricated.

export interface IMandi extends Document {
  name: string;               // Official market name
  district: string;
  state: string;
  latitude?: number;          // Required for map display — may be null if unverified
  longitude?: number;
  coordinatesVerified: boolean;
  ogdMarketName?: string;     // Exact name string used in OGD dataset
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mandiSchema = new Schema<IMandi>(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    latitude: { type: Number, min: 8, max: 37 },   // India bounding box
    longitude: { type: Number, min: 68, max: 97 },
    coordinatesVerified: { type: Boolean, default: false },
    ogdMarketName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique: (name, district, state)
mandiSchema.index({ name: 1, district: 1, state: 1 }, { unique: true });
mandiSchema.index({ state: 1, district: 1 });
mandiSchema.index({ isActive: 1 });

export const Mandi = model<IMandi>('Mandi', mandiSchema);
