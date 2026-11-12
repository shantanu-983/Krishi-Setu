import { Schema, model, Document, Types } from 'mongoose';

export type TaskCategory = 'SOWING' | 'IRRIGATION' | 'FERTILIZER' | 'PEST_CONTROL' | 'HARVESTING' | 'GENERAL';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IFarmTask extends Document {
  userId?: Types.ObjectId;
  title: string;
  cropName?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const farmTaskSchema = new Schema<IFarmTask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    cropName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: ['SOWING', 'IRRIGATION', 'FERTILIZER', 'PEST_CONTROL', 'HARVESTING', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

farmTaskSchema.index({ userId: 1, dueDate: 1 });
farmTaskSchema.index({ userId: 1, completed: 1 });

export const FarmTask = model<IFarmTask>('FarmTask', farmTaskSchema);
