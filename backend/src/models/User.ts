import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'farmer' | 'admin';

export interface IUser extends Document {
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  state?: string;
  district?: string;
  block?: string;
  villageId?: Types.ObjectId;
  villageName?: string;
  preferredLanguage?: 'en' | 'hi';
  farmSizeAcres?: number;
  soilType?: string;
  soilPh?: number;
  irrigationSource?: string;
  primaryCrops?: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
      index: true,
    },
    state: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    block: {
      type: String,
      trim: true,
    },
    villageId: {
      type: Schema.Types.ObjectId,
      ref: 'Village',
    },
    villageName: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    farmSizeAcres: {
      type: Number,
      min: 0,
      max: 10000,
    },
    soilType: {
      type: String,
      trim: true,
    },
    soilPh: {
      type: Number,
      min: 0,
      max: 14,
    },
    irrigationSource: {
      type: String,
      trim: true,
    },
    primaryCrops: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ state: 1, district: 1 });

export const User = model<IUser>('User', userSchema);
