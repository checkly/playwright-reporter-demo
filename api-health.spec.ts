import { test, expect } from '@playwright/test';

test.describe('API Health', () => {
  const BASE = 'http://localhost:3000';

  test('GET /api/health returns healthy status', async ({ request }) => {
    const response = await request.get(`${BASE}/api/health`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('uptime');
    expect(data.uptime).toBeGreaterThan(0);
  });

  test('GET /api/records returns the full catalog', async ({ request }) => {
    const response = await request.get(`${BASE}/api/records`);

    expect(response.status()).toBe(200);

    const records = await response.json();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThanOrEqual(8);

    const record = records[0];
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('title');
    expect(record).toHaveProperty('artist');
    expect(record).toHaveProperty('genre');
    expect(record).toHaveProperty('year');
    expect(record).toHaveProperty('price');
    expect(record).toHaveProperty('rating');
    expect(record).toHaveProperty('stock');
    expect(record).toHaveProperty('description');
  });

  test('GET /api/records?q=jazz filters by search query', async ({ request }) => {
    const response = await request.get(`${BASE}/api/records?q=jazz`);

    expect(response.status()).toBe(200);

    const records = await response.json();
    expect(records.length).toBeGreaterThan(0);

    for (const record of records) {
      const combined = `${record.title} ${record.artist} ${record.genre}`.toLowerCase();
      expect(combined).toContain('jazz');
    }
  });

  test('GET /api/records?genre=Electronic filters by genre', async ({ request }) => {
    const response = await request.get(`${BASE}/api/records?genre=Electronic`);

    expect(response.status()).toBe(200);

    const records = await response.json();
    expect(records.length).toBeGreaterThan(0);

    for (const record of records) {
      expect(record.genre).toBe('Electronic');
    }
  });

  test('GET /api/records/:id returns a single record', async ({ request }) => {
    const response = await request.get(`${BASE}/api/records/1`);

    expect(response.status()).toBe(200);

    const record = await response.json();
    expect(record.id).toBe(1);
    expect(record.title).toBeTruthy();
  });

  test('GET /api/records/:id returns 404 for missing record', async ({ request }) => {
    const response = await request.get(`${BASE}/api/records/999`);

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('Record not found');
  });

  test('GET /api/genres returns all available genres', async ({ request }) => {
    const response = await request.get(`${BASE}/api/genres`);

    expect(response.status()).toBe(200);

    const genres = await response.json();
    expect(Array.isArray(genres)).toBe(true);
    expect(genres.length).toBeGreaterThan(0);

    const sorted = [...genres].sort();
    expect(genres).toEqual(sorted);
  });

  test('POST /api/cart adds item and GET /api/cart retrieves it', async ({ request }) => {
    await request.delete(`${BASE}/api/cart`);

    const addResponse = await request.post(`${BASE}/api/cart`, {
      data: { recordId: 3, quantity: 2 },
    });
    expect(addResponse.status()).toBe(201);

    const cartResponse = await request.get(`${BASE}/api/cart`);
    expect(cartResponse.status()).toBe(200);

    const cart = await cartResponse.json();
    expect(cart.count).toBe(1);
    expect(cart.items[0].recordId).toBe(3);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.total).toBeCloseTo(63.98, 1);
  });

  test('API responds within acceptable latency', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${BASE}/api/records`);
    const duration = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(1000);
  });
});
