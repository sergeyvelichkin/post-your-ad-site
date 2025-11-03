import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildServer } from '../server.js';

describe('board pricing routes', () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the mocked board catalog', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/boards' });
    expect(response.statusCode).toBe(200);

    const body = response.json<{ boards: Array<{ slug: string }> }>();
    expect(body.boards).not.toHaveLength(0);
    expect(body.boards[0]).toHaveProperty('slug');
  });

  it('quotes a placement tier', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/boards/downtown-wall/quote',
      payload: { tierId: 'spotlight', days: 2 }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ total: number; breakdown: { subtotal: number } }>();
    expect(body.breakdown.subtotal).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(body.breakdown.subtotal);
  });
});
