import { Schema, model, Document } from 'mongoose';

// ─── Village Model ─────────────────────────────────────────────────────────────

export interface IVillage extends Document {
  name: string;
  district: string;
  state: string;
  block?: string;            // Sub-district / taluka / block
  pincode?: string;
  latitude?: number;
  longitude?: number;
  coordinatesVerified: boolean;
  population?: number;
  nearbyMandiIds: string[];  // ObjectId references (kept as string for flexibility)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const villageSchema = new Schema<IVillage>(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    block: { type: String, trim: true },
    pincode: { type: String, match: /^\d{6}$/ },
    latitude: { type: Number, min: 8, max: 37 },
    longitude: { type: Number, min: 68, max: 97 },
    coordinatesVerified: { type: Boolean, default: false },
    population: { type: Number, min: 0 },
    nearbyMandiIds: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

villageSchema.index({ name: 1, district: 1, state: 1 }, { unique: true });
villageSchema.index({ state: 1, district: 1 });

export const Village = model<IVillage>('Village', villageSchema);
