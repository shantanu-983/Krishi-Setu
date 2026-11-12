import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';

const app = createApp();

describe('Auth Module — Registration, Login, Profile & JWT Middleware', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validFarmer = {
    name: 'Rajesh Sharma',
    phone: '9876543210',
    password: 'password123',
    state: 'Madhya Pradesh',
    district: 'Indore',
    farmSizeAcres: 5.5,
    primaryCrops: ['Wheat', 'Soybean'],
  };

  it('POST /api/v1/auth/register registers a new farmer and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validFarmer);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.name).toBe('Rajesh Sharma');
    expect(res.body.data.user.phone).toBe('9876543210');
    expect(res.body.data.user.role).toBe('farmer');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose hash
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
  });

  it('POST /api/v1/auth/register rejects duplicate mobile number with 400', async () => {
    await request(app).post('/api/v1/auth/register').send(validFarmer);

    const dupRes = await request(app).post('/api/v1/auth/register').send({
      ...validFarmer,
      name: 'Duplicate Farmer',
    });

    expect(dupRes.status).toBe(400);
    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.error.message).toMatch(/already exists/i);
  });

  it('POST /api/v1/auth/register rejects invalid phone numbers', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validFarmer,
      phone: '12345',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/register rejects password shorter than 6 characters', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      ...validFarmer,
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login succeeds with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validFarmer);

    const res = await request(app).post('/api/v1/auth/login').send({
      phone: validFarmer.phone,
      password: validFarmer.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.phone).toBe(validFarmer.phone);
  });

  it('POST /api/v1/auth/login rejects incorrect password with 401', async () => {
    await request(app).post('/api/v1/auth/register').send(validFarmer);

    const res = await request(app).post('/api/v1/auth/login').send({
      phone: validFarmer.phone,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login rejects unregistered phone with 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phone: '9999999999',
      password: 'anypassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me rejects request without Bearer token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me rejects request with invalid Bearer token with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-string');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me returns profile for valid token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validFarmer);
    const token = regRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe(validFarmer.phone);
    expect(res.body.data.state).toBe(validFarmer.state);
  });

  it('PUT /api/v1/auth/me updates profile details', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validFarmer);
    const token = regRes.body.data.token;

    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Rajesh K. Sharma',
        farmSizeAcres: 8.0,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Rajesh K. Sharma');
    expect(res.body.data.farmSizeAcres).toBe(8.0);
  });
});
