import { Schema, model, Document, Types } from 'mongoose';

export type NotificationCategory = 'WEATHER' | 'TASK' | 'SCHEME' | 'MANDI' | 'GENERAL';
export type NotificationSeverity = 'ALERT' | 'WARNING' | 'INFO';

export interface INotification extends Document {
  userId?: Types.ObjectId;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  readAt?: Date;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    category: {
      type: String,
      required: true,
      enum: ['WEATHER', 'TASK', 'SCHEME', 'MANDI', 'GENERAL'],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['ALERT', 'WARNING', 'INFO'],
      default: 'INFO',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    link: {
      type: String,
      required: true,
      trim: true,
      default: 'dashboard',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    sourceId: {
      type: String,
      trim: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
