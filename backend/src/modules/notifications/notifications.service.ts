import { Types } from 'mongoose';
import { Notification, INotification, NotificationCategory, NotificationSeverity } from '../../models/Notification';
import { FarmTask } from '../../models/FarmTask';
import { GovernmentScheme } from '../../models/GovernmentScheme';
import { MandiPrice } from '../../models/MandiPrice';
import { getCachedWeather } from '../weather/weather.service';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string;
  timestamp: string;
  isRead: boolean;
  sourceId?: string;
}

export async function syncAndGetNotifications(userId?: string): Promise<AppNotification[]> {
  const now = new Date();
  const userObjectId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : undefined;

  // 1. Sync farm task alerts into DB (if userId exists or general demo tasks)
  try {
    const taskQuery: Record<string, unknown> = { completed: false };
    if (userObjectId) taskQuery.userId = userObjectId;

    const twoDaysAhead = new Date(now);
    twoDaysAhead.setDate(twoDaysAhead.getDate() + 2);

    const dueTasks = await FarmTask.find({
      ...taskQuery,
      dueDate: { $lte: twoDaysAhead },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    for (const task of dueTasks) {
      const sourceId = `task-${task._id}`;
      const existing = await Notification.findOne({ sourceId });
      if (!existing) {
        const isOverdue = new Date(task.dueDate) < now;
        await Notification.create({
          userId: task.userId || userObjectId,
          category: 'TASK',
          severity: isOverdue ? 'ALERT' : 'WARNING',
          title: isOverdue ? `Overdue Task: ${task.title}` : `Upcoming Task: ${task.title}`,
          message: task.notes || `Scheduled for ${new Date(task.dueDate).toLocaleDateString('en-IN')}`,
          link: 'schedule',
          sourceId,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.debug('FarmTask notification sync notice:', err);
  }

  // 2. Sync weather advisory alerts from live/cached weather
  try {
    const weather = await getCachedWeather(26.8467, 80.9462); // Pilot Lucknow coordinates
    if (weather && weather.advisories && weather.advisories.length > 0) {
      for (const adv of weather.advisories) {
        const sourceId = `weather-adv-${adv.id}`;
        const existing = await Notification.findOne({ sourceId });
        if (!existing) {
          await Notification.create({
            category: 'WEATHER',
            severity: adv.severity === 'ALERT' ? 'ALERT' : adv.severity === 'WARNING' ? 'WARNING' : 'INFO',
            title: `Weather Advisory: ${adv.title}`,
            message: adv.actionableAdvice || adv.description,
            link: 'weather',
            sourceId,
            isRead: false,
          });
        }
      }
    }
  } catch (err) {
    console.debug('Weather advisory notification sync notice:', err);
  }

  // 3. Sync Government Scheme awareness alerts from database
  try {
    const activeScheme = await GovernmentScheme.findOne({ status: 'ACTIVE', isActive: true })
      .sort({ updatedAt: -1 })
      .lean();

    if (activeScheme) {
      const sourceId = `scheme-${activeScheme.schemeCode}`;
      const existing = await Notification.findOne({ sourceId });
      if (!existing) {
        await Notification.create({
          category: 'SCHEME',
          severity: 'INFO',
          title: `${activeScheme.schemeCode}: ${activeScheme.schemeName}`,
          message: activeScheme.benefitDescription || activeScheme.eligibilitySummary,
          link: 'schemes',
          sourceId,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.debug('Scheme notification sync notice:', err);
  }

  // 4. Sync Mandi market price alert from latest MandiPrice record
  try {
    const latestPrice = await MandiPrice.findOne({ modalPriceInr: { $gt: 0 } })
      .sort({ observationDate: -1 })
      .populate('mandiId', 'name')
      .populate('cropId', 'name')
      .lean();

    if (latestPrice) {
      const mandiName = (latestPrice.mandiId as any)?.name || 'Local Mandi';
      const cropName = (latestPrice.cropId as any)?.name || 'Crop';
      const sourceId = `mandi-price-${latestPrice._id}`;
      const existing = await Notification.findOne({ sourceId });
      if (!existing) {
        await Notification.create({
          category: 'MANDI',
          severity: 'INFO',
          title: `Market Rate: ${cropName} at ${mandiName}`,
          message: `Latest modal price ₹${latestPrice.modalPriceInr}/quintal observed on ${new Date(latestPrice.observationDate).toLocaleDateString('en-IN')}.`,
          link: 'mandi',
          sourceId,
          isRead: false,
        });
      }
    }
  } catch (err) {
    console.debug('Mandi price notification sync notice:', err);
  }

  // 5. Query all matching notifications from MongoDB
  const query: Record<string, unknown> = userObjectId
    ? { $or: [{ userId: userObjectId }, { userId: null }, { userId: { $exists: false } }] }
    : {};

  const docs = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    category: doc.category,
    severity: doc.severity,
    title: doc.title,
    message: doc.message,
    link: doc.link,
    timestamp: doc.createdAt.toISOString(),
    isRead: doc.isRead,
    sourceId: doc.sourceId,
  }));
}

export async function markNotificationAsRead(id: string, userId?: string): Promise<boolean> {
  const query: Record<string, unknown> = { _id: id };
  if (userId && Types.ObjectId.isValid(userId)) {
    query.$or = [{ userId: new Types.ObjectId(userId) }, { userId: null }, { userId: { $exists: false } }];
  }

  const result = await Notification.updateOne(query, {
    $set: { isRead: true, readAt: new Date() },
  });

  return result.modifiedCount > 0;
}

export async function markAllNotificationsAsRead(userId?: string): Promise<number> {
  const query: Record<string, unknown> = { isRead: false };
  if (userId && Types.ObjectId.isValid(userId)) {
    query.$or = [{ userId: new Types.ObjectId(userId) }, { userId: null }, { userId: { $exists: false } }];
  }

  const result = await Notification.updateMany(query, {
    $set: { isRead: true, readAt: new Date() },
  });

  return result.modifiedCount;
}

export async function createNotification(data: Partial<INotification>): Promise<INotification> {
  return await Notification.create(data);
}
