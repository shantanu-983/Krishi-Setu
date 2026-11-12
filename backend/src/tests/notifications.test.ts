import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { Notification } from '../models/Notification';
import { FarmTask } from '../models/FarmTask';
import { GovernmentScheme } from '../models/GovernmentScheme';

const app = createApp();

describe('Notifications Module — API Endpoints', () => {
  beforeEach(async () => {
    await Promise.all([
      Notification.deleteMany({}),
      FarmTask.deleteMany({}),
      GovernmentScheme.deleteMany({}),
    ]);
  });

  it('GET /api/v1/notifications returns 200 and aggregated notifications array', async () => {
    // Seed an active government scheme to trigger real notification aggregation
    await GovernmentScheme.create({
      schemeCode: 'PM-KISAN-NOTIF',
      schemeName: 'PM-KISAN Income Support',
      ministry: 'Ministry of Agriculture',
      benefitType: 'Direct Support',
      benefitDescription: 'Rs 6,000 per year in 3 installments',
      applicableStates: [],
      eligibilitySummary: 'Small and marginal landholding farmer families',
      officialUrl: 'https://pmkisan.gov.in',
      status: 'ACTIVE',
    });

    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('category');
    expect(res.body.data[0]).toHaveProperty('isRead');
  });

  it('PATCH /api/v1/notifications/:id/read marks single notification as read', async () => {
    const notif = await Notification.create({
      category: 'TASK',
      severity: 'WARNING',
      title: 'Upcoming Irrigation',
      message: 'Check soil moisture before Friday',
      link: 'schedule',
      isRead: false,
    });

    const res = await request(app).patch(`/api/v1/notifications/${notif._id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.success).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated?.isRead).toBe(true);
    expect(updated?.readAt).toBeDefined();
  });

  it('POST /api/v1/notifications/mark-all-read marks all unread notifications as read', async () => {
    await Notification.create([
      {
        category: 'WEATHER',
        severity: 'ALERT',
        title: 'Frost warning',
        message: 'Take precaution for Rabi crops',
        link: 'weather',
        isRead: false,
      },
      {
        category: 'MANDI',
        severity: 'INFO',
        title: 'Price jump in Wheat',
        message: 'Mohanlalganj mandi reports higher modal rate',
        link: 'mandi',
        isRead: false,
      },
    ]);

    const res = await request(app).post('/api/v1/notifications/mark-all-read');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBe(2);

    const remainingUnread = await Notification.countDocuments({ isRead: false });
    expect(remainingUnread).toBe(0);
  });
});
