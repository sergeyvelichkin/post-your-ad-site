import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../server.js';
import { env } from '../env.js';
import {
  RATE_LIMIT_MAX_EVENTS,
  resetCanvasStore
} from '../modules/canvas/canvas-store.js';

describe('canvas routes', () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetCanvasStore();
  });

  it('issues a session cookie and returns empty events list', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/boards/downtown-wall/canvas/events' });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ boardId: string; events: unknown[] }>();
    expect(body).toEqual({ boardId: 'downtown-wall', events: [] });

    const sessionCookie = response.cookies.find((cookie) => cookie.name === env.SESSION_COOKIE_NAME);
    expect(sessionCookie?.value).toBeTruthy();
  });

  it('creates a text event and returns it in the feed', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/boards/downtown-wall/canvas/events' });
    const sessionCookie = initial.cookies.find((cookie) => cookie.name === env.SESSION_COOKIE_NAME);
    const cookieHeader = `${env.SESSION_COOKIE_NAME}=${sessionCookie?.value ?? ''}`;

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/boards/downtown-wall/canvas/events',
      payload: {
        type: 'text',
        payload: {
          text: 'Hello world',
          color: '#0f172a',
          fontSize: 18,
          position: { x: 0.5, y: 0.5 }
        }
      },
      headers: {
        cookie: cookieHeader
      }
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/boards/downtown-wall/canvas/events',
      headers: {
        cookie: cookieHeader
      }
    });

    const listBody = listResponse.json<{ events: Array<{ type: string; payload: { text?: string } }> }>();
    expect(listBody.events).toHaveLength(1);
    expect(listBody.events[0].type).toBe('text');
    expect(listBody.events[0]?.payload?.text).toBe('Hello world');
  });

  it('enforces per-session rate limits', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/boards/downtown-wall/canvas/events' });
    const sessionCookie = initial.cookies.find((cookie) => cookie.name === env.SESSION_COOKIE_NAME);
    const cookieHeader = `${env.SESSION_COOKIE_NAME}=${sessionCookie?.value ?? ''}`;

    for (let index = 0; index < RATE_LIMIT_MAX_EVENTS + 1; index += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/boards/downtown-wall/canvas/events',
        payload: {
          type: 'text',
          payload: {
            text: `event-${index}`,
            color: '#1f2937',
            fontSize: 16,
            position: { x: 0.5, y: 0.5 }
          }
        },
        headers: {
          cookie: cookieHeader
        }
      });

      if (index < RATE_LIMIT_MAX_EVENTS) {
        expect(response.statusCode).toBe(201);
      } else {
        expect(response.statusCode).toBe(429);
      }
    }
  });

  it('clears events when admin token provided', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/boards/downtown-wall/canvas/events' });
    const sessionCookie = initial.cookies.find((cookie) => cookie.name === env.SESSION_COOKIE_NAME);
    const cookieHeader = `${env.SESSION_COOKIE_NAME}=${sessionCookie?.value ?? ''}`;

    await app.inject({
      method: 'POST',
      url: '/api/boards/downtown-wall/canvas/events',
      payload: {
        type: 'text',
        payload: {
          text: 'to be cleared',
          color: '#991b1b',
          fontSize: 18,
          position: { x: 0.5, y: 0.5 }
        }
      },
      headers: {
        cookie: cookieHeader
      }
    });

    const clearResponse = await app.inject({
      method: 'POST',
      url: '/api/boards/downtown-wall/canvas/clear',
      headers: {
        'x-admin-token': env.CANVAS_ADMIN_TOKEN ?? '',
        cookie: cookieHeader
      }
    });

    expect(clearResponse.statusCode).toBe(204);

    const listResponse = await app.inject({ method: 'GET', url: '/api/boards/downtown-wall/canvas/events' });
    const listBody = listResponse.json<{ events: unknown[] }>();
    expect(listBody.events).toHaveLength(0);
  });
});
