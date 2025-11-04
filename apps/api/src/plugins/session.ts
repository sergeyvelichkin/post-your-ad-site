import { randomUUID } from 'node:crypto';
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyRequest {
    sessionId: string;
  }
}

const sessionPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cookie, {
    parseOptions: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: env.NODE_ENV === 'production'
    }
  });

  fastify.decorateRequest('sessionId', '');

  fastify.addHook('onRequest', async (request, reply) => {
    const cookieName = env.SESSION_COOKIE_NAME;
    const existing = request.cookies?.[cookieName];

    if (typeof existing === 'string' && existing.length >= 16) {
      request.sessionId = existing;
      return;
    }

    const sessionId = randomUUID();
    request.sessionId = sessionId;

    void reply.setCookie(cookieName, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
  });
};

export default fp(sessionPlugin, {
  name: 'session-plugin'
});
